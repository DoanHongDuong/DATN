import { useContext } from 'react';
import { SocketContext } from '../store/socket.context';

/**
 * Hook trả về socket và trạng thái kết nối từ SocketContext toàn cục.
 * Socket được tạo một lần duy nhất tại SocketProvider (App.tsx),
 * nên mọi component đều dùng chung connection.
 */
export const useSocket = () => {
  return useContext(SocketContext);
};
