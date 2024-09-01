import React, {useState, useEffect} from 'react';
import {
  View,
  FlatList,
  Alert,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {Text, Checkbox, Button} from 'react-native-paper';
import axios from 'axios';
import {getAuth} from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackButton from '../components/BackButton';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {API_URL} from '@env';

const UserFarmList = ({navigation}) => {
  const [farms, setFarms] = useState([]);
  const [selectedFarms, setSelectedFarms] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentFarmId, setCurrentFarmId] = useState(null);

  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      fetchUserFarms();
      getCurrentFarm();
    }
  }, [user]);

  const fetchUserFarms = async () => {
    const userId = user.uid;
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_URL}/farm/getfarm/${userId}`);
      const fetchedFarms = res.data;

      // Set default farm if none is selected
      const selectedFarmId = await AsyncStorage.getItem('selectedFarm');
      if (!selectedFarmId && fetchedFarms.length > 0) {
        const defaultFarm = fetchedFarms[0];
        await AsyncStorage.setItem('selectedFarm', defaultFarm.id);
        await AsyncStorage.setItem(
          'sectorList',
          JSON.stringify(defaultFarm.sectorList),
        );
        setCurrentFarmId(defaultFarm.id);
      }

      setFarms(fetchedFarms);
    } catch (error) {
      console.error('Error fetching farms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentFarm = async () => {
    const selectedFarmId = await AsyncStorage.getItem('selectedFarm');
    setCurrentFarmId(selectedFarmId);
  };

  const handleSelectFarm = farmId => {
    setSelectedFarms(prevSelected =>
      prevSelected.includes(farmId)
        ? prevSelected.filter(id => id !== farmId)
        : [...prevSelected, farmId],
    );
  };

  const handleDeleteFarms = async () => {
    // Prompt for confirmation to prevent accidental deletion
    const confirmation = await Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete the selected farms?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await deleteSelectedFarms();
              navigation.navigate('Dashboard', {refresh: true});
            } catch (error) {
              console.error('Error deleting farms:', error);
              Alert.alert('Error', 'An error occurred while deleting farms.'); // User-friendly error message
            }
          },
        },
      ],
    );

    // Return if user cancels
    if (confirmation.type !== 'positive') {
      return;
    }
  };

  const deleteSelectedFarms = async () => {
    try {
      const deleteRequests = selectedFarms.map(async farmId => {
        if (farmId !== currentFarmId) {
          await axios.delete(`${API_URL}/farm/deletefarm/${farmId}`, {
            params: {userId: user.uid},
          });
          await Promise.all(deleteRequests);
          setFarms(prevFarms =>
            prevFarms.filter(farm => !selectedFarms.includes(farm.id)),
          );
          setSelectedFarms([]);
        } else {
          // Alert the user that current farm cannot be deleted
          Alert.alert('Warning', 'Cannot delete the current farm.');
        }
      });
    } catch (error) {
      console.error('Error deleting farms:', error);
    }
  };

  const handleSetCurrentFarm = async farm => {
    try {
      await AsyncStorage.setItem('selectedFarm', farm.id);
      await AsyncStorage.setItem('sectorList', JSON.stringify(farm.sectorList));
      setCurrentFarmId(farm.id);
      Alert.alert('Success', 'Current farm set successfully.');
      navigation.navigate('Dashboard', {refresh: true});
    } catch (error) {
      console.error('Error setting current farm:', error);
      Alert.alert('Error', 'Failed to set current farm.');
    }
  };

  return (
    <View style={styles.container}>
      <BackButton />
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddFarm')}>
        <Icon name="add" size={31} color="black" />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => setIsEditing(!isEditing)}>
        <Icon name="edit" size={27} color="black" />
      </TouchableOpacity>
      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={farms}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <View style={styles.farmItem}>
              {isEditing && (
                <Checkbox
                  status={
                    selectedFarms.includes(item.id) ? 'checked' : 'unchecked'
                  }
                  onPress={() => handleSelectFarm(item.id)}
                  style={{color: 'green'}}
                />
              )}
              <View style={styles.farmDetails}>
                <Text style={styles.farmName}>Farm Name: {item.name}</Text>
                <Text>Location: {item.location}</Text>
                {!isEditing && (
                  <Button
                    mode="contained"
                    onPress={() => handleSetCurrentFarm(item)}
                    style={
                      item.id === currentFarmId
                        ? styles.currentFarmButton
                        : styles.setFarmButton
                    }>
                    <Text
                      style={
                        item.id === currentFarmId
                          ? styles.currentFarmButtonText
                          : styles.FarmButtonText
                      }>
                      {item.id === currentFarmId
                        ? 'Current Farm'
                        : 'Set as Current Farm'}
                    </Text>
                  </Button>
                )}
              </View>
            </View>
          )}
        />
      )}
      {isEditing && selectedFarms.length > 0 && (
        <Button
          mode="contained"
          onPress={handleDeleteFarms}
          style={{marginBottom: 80, backgroundColor: 'red', color: '#FFF'}}>
          Delete Selected Farms
        </Button>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#d3e8d3',
  },
  farmItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    position: 'relative',
  },
  farmDetails: {
    flex: 1,
    marginLeft: 10,
  },
  farmName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  editButton: {
    position: 'absolute',
    padding: 10,
    top: 10,
    right: 10,
  },
  addButton: {
    position: 'absolute',
    padding: 10,
    top: 10,
    right: 50,
  },
  setFarmButton: {
    backgroundColor: '#4CAF50',
    marginTop: 10,
  },
  currentFarmButton: {
    backgroundColor: '#FFF',
    marginTop: 10,
  },
  currentFarmButtonText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  FarmButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});

export default UserFarmList;
