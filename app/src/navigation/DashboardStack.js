import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import ParameterScreen from '../screens/ParameterScreen';
import CalendarScreen from '../screens/CalendarScreen';
import DashboardScreen from '../screens/DashboardScreen';
import UserStack from './UserStack';
import AddFarm from '../screens/AddFarm';
import LoadingScreen from '../screens/LoadingScreen';
import UserFarmList from '../screens/UserFarmList';
import UserSectorList from '../screens/UserSectorList';

const Stack = createStackNavigator();

const DashboardStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="Loading"
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="Loading" component={LoadingScreen} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="Parameter" component={ParameterScreen} />
      <Stack.Screen name="Calendar" component={CalendarScreen} />
      <Stack.Screen name="UserProfile" component={UserStack} />
      <Stack.Screen name="AddFarm" component={AddFarm} />
      <Stack.Screen name="FarmList" component={UserFarmList} />
      <Stack.Screen name="SectorList" component={UserSectorList} />
    </Stack.Navigator>
  );
};

export default DashboardStack;
