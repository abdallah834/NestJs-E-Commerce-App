import { Socket } from 'socket.io';

export const getAuthenticatedSocket = (client: Socket) => {
  return (
    (client.handshake.auth.authorization as string) ||
    (client.handshake.headers.authorization as string)
  );
};
