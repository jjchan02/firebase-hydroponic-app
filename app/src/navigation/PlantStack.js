import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import PlantScreen from '../screens/PlantScreen';
import AddPlant from '../screens/AddPlant';
import PlantDetail from '../screens/PlantDetail';
import EditPlantDetail from '../screens/EditPlantDetail';

const Stack = createStackNavigator();

const PlantStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="Plant" component={PlantScreen} />
      <Stack.Screen name="AddPlant" component={AddPlant} />
      <Stack.Screen name="PlantDetail" component={PlantDetail} />
      <Stack.Screen name="EditPlantDetail" component={EditPlantDetail} />
    </Stack.Navigator>
  );
};

export default PlantStack;
