import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import UserProfile from '../screens/UserProfile';
import NotificationSettings from '../screens/NotificationSettings ';

const Stack = createStackNavigator();

const UserStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="UserProfile" component={UserProfile} />
      <Stack.Screen name="Notification" component={NotificationSettings} />
    </Stack.Navigator>
  );
};

export default UserStack;
