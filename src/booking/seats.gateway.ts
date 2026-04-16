import {
  WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection,
  OnGatewayDisconnect, MessageBody, ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

/**
 * Real-time seat selection room for a trip.
 *
 * Clients:
 * - Join a trip room when viewing its seat map
 * - Emit `seat:focus` when hovering/tentatively selecting a seat
 * - Receive `room:viewers` with current number of active viewers
 * - Receive `seat:focused` when another viewer focuses a seat
 * - Receive `seats:changed` broadcast when seats are locked/booked (from HTTP side)
 *
 * Viewer count + focus events create booking.com-style FOMO.
 */
@WebSocketGateway({
  cors: {
    origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:3001').split(',').map(s => s.trim()),
    credentials: true,
  },
  namespace: '/seats',
})
@Injectable()
export class SeatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(SeatsGateway.name);

  /** tripId → Set<socketId> — fast lookup of viewers per trip */
  private roomViewers = new Map<string, Set<string>>();

  /** socketId → { tripId, focusedSeat?: number } */
  private socketState = new Map<string, { tripId?: string; focusedSeat?: number }>();

  handleConnection(client: Socket) {
    this.socketState.set(client.id, {});
  }

  handleDisconnect(client: Socket) {
    const state = this.socketState.get(client.id);
    if (state?.tripId) this.leaveTripRoom(client, state.tripId);
    this.socketState.delete(client.id);
  }

  @SubscribeMessage('trip:join')
  onTripJoin(@MessageBody() data: { tripId: string }, @ConnectedSocket() client: Socket) {
    if (!data?.tripId || typeof data.tripId !== 'string') return { ok: false };
    const prev = this.socketState.get(client.id);
    if (prev?.tripId && prev.tripId !== data.tripId) {
      this.leaveTripRoom(client, prev.tripId);
    }

    client.join(`trip:${data.tripId}`);
    const viewers = this.roomViewers.get(data.tripId) || new Set();
    viewers.add(client.id);
    this.roomViewers.set(data.tripId, viewers);
    this.socketState.set(client.id, { tripId: data.tripId });

    this.broadcastViewerCount(data.tripId);
    return { ok: true, viewers: viewers.size };
  }

  @SubscribeMessage('trip:leave')
  onTripLeave(@MessageBody() data: { tripId: string }, @ConnectedSocket() client: Socket) {
    if (data?.tripId) this.leaveTripRoom(client, data.tripId);
    return { ok: true };
  }

  @SubscribeMessage('seat:focus')
  onSeatFocus(
    @MessageBody() data: { tripId: string; seatNumber: number | null },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data?.tripId) return;
    const state = this.socketState.get(client.id);
    if (state?.tripId !== data.tripId) return;

    state.focusedSeat = data.seatNumber ?? undefined;
    this.socketState.set(client.id, state);

    // Broadcast to everyone else in the room (not the sender)
    client.to(`trip:${data.tripId}`).emit('seat:focused', {
      socketId: client.id,
      seatNumber: data.seatNumber,
    });
  }

  /**
   * Called from HTTP side (booking service) when seats change state.
   * Example: user locks seats → broadcast so other viewers see them greyed out instantly.
   */
  broadcastSeatsChanged(tripId: string, payload: {
    type: 'LOCKED' | 'UNLOCKED' | 'BOOKED' | 'FREED';
    seatNumbers: number[];
  }) {
    this.server.to(`trip:${tripId}`).emit('seats:changed', payload);
  }

  private leaveTripRoom(client: Socket, tripId: string) {
    client.leave(`trip:${tripId}`);
    const viewers = this.roomViewers.get(tripId);
    if (viewers) {
      viewers.delete(client.id);
      if (viewers.size === 0) this.roomViewers.delete(tripId);
      else this.roomViewers.set(tripId, viewers);
    }
    this.broadcastViewerCount(tripId);
  }

  private broadcastViewerCount(tripId: string) {
    const count = this.roomViewers.get(tripId)?.size || 0;
    this.server.to(`trip:${tripId}`).emit('room:viewers', { count });
  }
}
