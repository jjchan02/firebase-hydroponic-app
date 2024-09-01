import React, {useState} from 'react';
import {View, Text, TextInput, Button, StyleSheet} from 'react-native';
import {getAuth} from '@react-native-firebase/auth';
import axios from 'axios';
import {TouchableOpacity} from 'react-native-gesture-handler';
import Header from '../components/Header';
import {useNavigation} from '@react-navigation/native';
import {API_URL} from '@env';

const AddFarmScreen = ({navigation}) => {
  const [farmName, setFarmName] = useState('');
  const [location, setLocation] = useState('');
  const auth = getAuth();
  const redirect = useNavigation();

  const handleAddFarm = async () => {
    const user = auth.currentUser;
    if (user && farmName && location) {
      try {
        const newFarm = {
          userId: user.uid,
          name: farmName,
          location,
          createdAt: new Date(),
        };
        const res = await axios.post(`${API_URL}/farm/addfarm`, newFarm);
        if (res.status === 200) {
          navigation.navigate('Dashboard');
        } else {
          console.error('Failed to add farm');
        }
      } catch (error) {
        console.error('Error adding farm: ', error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Header navigation={redirect} />
      <Text style={styles.header}>Add Farm</Text>
      <TextInput
        style={styles.input}
        placeholder="Farm Name"
        value={farmName}
        onChangeText={setFarmName}
      />
      <TextInput
        style={styles.input}
        placeholder="Location"
        value={location}
        onChangeText={setLocation}
      />
      <TouchableOpacity style={styles.saveButton} onPress={handleAddFarm}>
        <Text style={styles.saveButtonText}>Add Farm</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#d3e8d3',
    flex: 1,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    padding: 10,
    marginBottom: 20,
    backgroundColor: '#ffffff',
    borderRadius: 5,
  },
  saveButton: {
    width: '100%',
    padding: 15,
    backgroundColor: '#4caf50',
    borderRadius: 5,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AddFarmScreen;
