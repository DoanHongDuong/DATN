import React, { useEffect, useState, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';
import { SocketContext } from './socket.context';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }

    const socketInstance = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true,
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (err) => {
      console.warn('Socket connect_error:', err.message);
    });

    // Đặt trong setTimeout(0) để đảm bảo state cập nhật đúng chu kỳ render
    const timer = setTimeout(() => {
      setSocket(socketInstance);
    }, 0);

    return () => {
      clearTimeout(timer);
      socketInstance.disconnect();
      setIsConnected(false);
      setSocket(null);
    };
  }, [token]);

  const value = useMemo(
    () => ({ socket, isConnected }),
    [socket, isConnected],
  );

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

