import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import ReminderScreen from '../screens/ReminderScreen';
import ReportScreen from '../screens/ReportScreen';

const Stack = createStackNavigator();

const ReminderStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="Reminder" component={ReminderScreen} />
      <Stack.Screen name="Report" component={ReportScreen} />
    </Stack.Navigator>
  );
};

export default ReminderStack;
