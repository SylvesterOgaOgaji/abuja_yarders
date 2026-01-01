import { formatDistanceToNow } from "date-fns";
import { Bell, Calendar, DollarSign, Info, Link, User } from "lucide-react";
import { Notification } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export const NotificationItem = ({ notification, onRead }: { notification: Notification; onRead: (id: string) => void }) => {
    const navigate = useNavigate();

    const getIcon = () => {
        switch (notification.type) {
            case 'pledge':
            case 'funding':
                return <DollarSign className="h-4 w-4 text-green-500" />;
            case 'birthday':
                return <Calendar className="h-4 w-4 text-pink-500" />;
            case 'chat_link':
                return <Link className="h-4 w-4 text-blue-500" />;
            case 'profile':
                return <User className="h-4 w-4 text-orange-500" />;
            default:
                return <Info className="h-4 w-4 text-gray-500" />;
        }
    };

    const handleClick = () => {
        if (!notification.is_read) {
            onRead(notification.id);
        }
        if (notification.action_link) {
            navigate(notification.action_link);
        }
    };

    return (
        <div
            onClick={handleClick}
            className={cn(
                "flex gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors border-b last:border-0",
                !notification.is_read && "bg-muted/20"
            )}
        >
            <div className="mt-1 bg-background p-2 rounded-full h-8 w-8 flex items-center justify-center border shadow-sm shrink-0">
                {getIcon()}
            </div>
            <div className="space-y-1 flex-1">
                <div className="flex justify-between items-start gap-2">
                    <p className={cn("text-sm font-medium leading-none", !notification.is_read && "font-bold")}>
                        {notification.title}
                    </p>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                    {notification.message}
                </p>
                {!notification.is_read && (
                    <span className="inline-block w-2 h-2 rounded-full bg-primary mt-1" />
                )}
            </div>
        </div>
    );
};
