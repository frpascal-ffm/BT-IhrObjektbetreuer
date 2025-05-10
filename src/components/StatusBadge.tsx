
import { JobStatus, statusColorMap, statusNameMap } from '@/types';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: JobStatus;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white",
        statusColorMap[status],
        className
      )}
    >
      {statusNameMap[status]}
    </span>
  );
};

export default StatusBadge;
