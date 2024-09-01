import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DashboardStack from '../navigation/DashboardStack';
import ControlScreen from '../screens/ControlScreen';
import PlantStack from './PlantStack';
import ReportScreen from '../screens/ReportScreen';
import ReminderStack from './ReminderStack';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        tabBarActiveTintColor: '#42f44b',
        tabBarShowLabel: false,
        headerShown: false,
        tabBarStyle: {
          height: 72,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          borderTopWidth: 0,
          borderTopColor: '#FFFFFF',
          paddingHorizontal: 4,
          position: 'absolute',
        },
      }}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardStack}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({color}) => (
            <Icon name="dashboard" color={color} size={30} />
          ),
        }}
      />
      <Tab.Screen
        name="Control"
        component={ControlScreen}
        options={{
          tabBarLabel: 'Control',
          tabBarIcon: ({color}) => <Icon name="tune" color={color} size={30} />,
        }}
      />
      <Tab.Screen
        name="Insight"
        component={ReportScreen}
        options={{
          tabBarLabel: 'Insight',
          tabBarIcon: ({color}) => (
            <Icon name="analytics" color={color} size={30} />
          ),
        }}
      />
      <Tab.Screen
        name="Plant"
        component={PlantStack}
        options={{
          tabBarLabel: 'Plant',
          tabBarIcon: ({color}) => <Icon name="eco" color={color} size={30} />,
        }}
      />

      <Tab.Screen
        name="Reminder"
        component={ReminderStack}
        options={{
          tabBarLabel: 'Reminder',
          tabBarIcon: ({color}) => (
            <Icon name="notifications" color={color} size={30} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
