"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

/**
 * Connects to the /seats WebSocket namespace for a given trip.
 * Provides:
 * - `viewers` — live count of other people looking at this trip's seats
 * - `focusedByOthers` — seat numbers other viewers are focusing on (FOMO cue)
 * - `onSeatsChanged` callback — fired when another user locks/books/cancels a seat
 * - `focus(seatNumber)` — broadcast this client's current hover/selection
 */

interface SeatsChangedPayload {
  type: 'LOCKED' | 'UNLOCKED' | 'BOOKED' | 'FREED';
  seatNumbers: number[];
}

interface UseSeatRoomOptions {
  tripId: string | null;
  onSeatsChanged?: (payload: SeatsChangedPayload) => void;
}

const FOCUS_EXPIRY_MS = 8000;

export function useSeatRoom({ tripId, onSeatsChanged }: UseSeatRoomOptions) {
  const [viewers, setViewers] = useState(0);
  const [connected, setConnected] = useState(false);
  /** Map of socketId → { seatNumber, expiresAt } */
  const [focusedByOthers, setFocusedByOthers] = useState<Record<string, { seatNumber: number; expiresAt: number }>>({});
  const socketRef = useRef<Socket | null>(null);
  const changedCbRef = useRef(onSeatsChanged);

  // Keep callback ref fresh without restarting socket
  useEffect(() => {
    changedCbRef.current = onSeatsChanged;
  }, [onSeatsChanged]);

  useEffect(() => {
    if (!tripId) return;

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const socket = io(`${baseUrl}/seats`, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1500,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('trip:join', { tripId });
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('room:viewers', ({ count }: { count: number }) => {
      setViewers(count);
    });

    socket.on('seat:focused', ({ socketId, seatNumber }: { socketId: string; seatNumber: number | null }) => {
      setFocusedByOthers((prev) => {
        const next = { ...prev };
        if (seatNumber === null || seatNumber === undefined) {
          delete next[socketId];
        } else {
          next[socketId] = { seatNumber, expiresAt: Date.now() + FOCUS_EXPIRY_MS };
        }
        return next;
      });
    });

    socket.on('seats:changed', (payload: SeatsChangedPayload) => {
      changedCbRef.current?.(payload);
    });

    return () => {
      socket.emit('trip:leave', { tripId });
      socket.disconnect();
      socketRef.current = null;
      setViewers(0);
      setConnected(false);
      setFocusedByOthers({});
    };
  }, [tripId]);

  // Prune expired focus entries every 2s
  useEffect(() => {
    const id = setInterval(() => {
      setFocusedByOthers((prev) => {
        const now = Date.now();
        const next: typeof prev = {};
        let changed = false;
        for (const k in prev) {
          if (prev[k].expiresAt > now) next[k] = prev[k];
          else changed = true;
        }
        return changed ? next : prev;
      });
    }, 2000);
    return () => clearInterval(id);
  }, []);

  function focus(seatNumber: number | null) {
    if (!socketRef.current || !tripId) return;
    socketRef.current.emit('seat:focus', { tripId, seatNumber });
  }

  /** Returns set of seat numbers currently being focused by OTHER viewers */
  const focusedSeats = new Set(Object.values(focusedByOthers).map((x) => x.seatNumber));

  return {
    viewers,
    connected,
    focusedSeats,
    focus,
  };
}
