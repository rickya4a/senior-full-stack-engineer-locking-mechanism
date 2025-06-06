import { CursorPosition } from '@/types';
import { FollowPointer } from '../ui/FollowingPointer';

interface CollaborativeCursorProps {
  cursor: CursorPosition;
}

export default function CollaborativeCursor({ cursor }: CollaborativeCursorProps) {
  return (
    <FollowPointer
      x={cursor.x}
      y={cursor.y}
      title={cursor.userName}
    />
  );
}