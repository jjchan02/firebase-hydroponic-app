import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import RootNavigation from './src/navigation/index';
import {AuthProvider} from './src/utils/AuthContext';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const setMessagingToken = async () => {
    try {
      await messaging().registerDeviceForRemoteMessages();
      let messagingToken = await AsyncStorage.getItem('messaging-token');
      if (!!messagingToken) {
        console.log('Token: ', messagingToken);
      } else {
        const token = await messaging().getToken();
        await AsyncStorage.setItem('messaging-token', token);
        console.log(token);
      }
    } catch (error) {
      console.log('Messaging Error: ', error);
    }
  };

  // const handleForegroundMessage = async remoteMessage => {
  //   Alert.alert('A new FCM message arrived!', JSON.stringify(remoteMessage));
  // };

  const handleBackgroundMessage = async remoteMessage => {
    console.log('Message handled in the background!', remoteMessage);
  };

  useEffect(() => {
    setMessagingToken();

    //const unsubscribe = messaging().onMessage(handleForegroundMessage);

    messaging().setBackgroundMessageHandler(handleBackgroundMessage);

    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log(
        'Notification caused app to open from background state:',
        remoteMessage.notification,
      );
    });

    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log(
            'Notification caused app to open from quit state:',
            remoteMessage.notification,
          );
        }
      });

    //return unsubscribe;
  }, []);

  return (
    <NavigationContainer>
      <AuthProvider>
        <RootNavigation />
      </AuthProvider>
    </NavigationContainer>
  );
}
