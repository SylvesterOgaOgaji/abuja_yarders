import { useEffect, useState } from 'react';
import { PushNotifications, Token, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

export const usePushNotifications = () => {
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        const register = async () => {
            let permStatus = await PushNotifications.checkPermissions();

            if (permStatus.receive === 'prompt') {
                permStatus = await PushNotifications.requestPermissions();
            }

            if (permStatus.receive !== 'granted') {
                // throw new Error('User denied permissions!');
                console.log('User denied permissions');
                return;
            }

            await PushNotifications.register();
        };

        // Listeners
        PushNotifications.addListener('registration', (token: Token) => {
            console.log('Push registration success, token: ' + token.value);
            setToken(token.value);
            // TODO: Send token to your backend (Supabase) to associate with user
        });

        PushNotifications.addListener('registrationError', (error: any) => {
            console.error('Error on registration: ' + JSON.stringify(error));
        });

        PushNotifications.addListener('pushNotificationReceived', (notification: any) => {
            console.log('Push received: ' + JSON.stringify(notification));
            toast.info(notification.title || 'New Notification');
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
            console.log('Push action performed: ' + JSON.stringify(notification));
        });

        register();

        // Cleanup
        return () => {
            if (Capacitor.isNativePlatform()) {
                PushNotifications.removeAllListeners();
            }
        };

    }, []);

    return { token };
};
