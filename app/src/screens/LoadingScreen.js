import React, {useEffect} from 'react';
import {View, Text, ActivityIndicator, StyleSheet} from 'react-native';
import {getAuth} from '@react-native-firebase/auth';
import {API_URL} from '@env';
import axios from 'axios';

const LoadingScreen = ({navigation}) => {
  const auth = getAuth();

  const checkUserFarm = async () => {
    const user = auth.currentUser;
    if (user) {
      const userId = user.uid;
      try {
        const res = await axios.get(`${API_URL}/farm/getfarm/${userId}`);
        const data = res.data;

        // Check if data is an array and has at least one item
        if (Array.isArray(data) && data.length > 0 && data[0].sectorList) {
          navigation.replace('Dashboard');
        } else {
          navigation.replace('AddFarm');
        }
      } catch (error) {
        console.error('Error checking farms:', error);
      }
    }
  };

  useEffect(() => {
    checkUserFarm();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0000ff" />
      <Text>Loading...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LoadingScreen;
