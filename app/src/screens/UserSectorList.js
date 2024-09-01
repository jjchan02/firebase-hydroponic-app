import React, {useState, useEffect} from 'react';
import {
  View,
  FlatList,
  Alert,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import {Text, Checkbox, Button} from 'react-native-paper';
import axios from 'axios';
import {getAuth} from '@react-native-firebase/auth';
import BackButton from '../components/BackButton';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {format} from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getStoredSectorList} from '../utils/LocalSectorList';
import {API_URL} from '@env';

const UserSectorList = ({navigation, route}) => {
  const {farmId} = route.params;
  const [sectors, setSectors] = useState([]);
  const [selectedSectors, setSelectedSectors] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [deviceId, setDeviceId] = useState('');

  const auth = getAuth();
  const user = auth.currentUser;
  const userId = user.uid;

  useEffect(() => {
    if (user) {
      fetchUserSectors();
    }
  }, [user]);

  const convertToMYT = utcTimeInMs => {
    const utcDate = new Date(utcTimeInMs);
    const offset = utcDate.getTimezoneOffset() * 60000; // Get UTC offset in milliseconds
    const mytTimeInMs = utcTimeInMs - offset + 28800000; // Add 8 hours (28800000 ms) for MYT
    return new Date(mytTimeInMs);
  };

  const fetchUserSectors = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_URL}/sector/getSector/${farmId}`);
      const data = res.data;
      const sectorList = data.map(sector => ({
        id: sector.id,
        createdAt: sector.createdAt
          ? new Date(sector.createdAt._seconds * 1000)
          : null,
      }));
      setSectors(sectorList);
    } catch (error) {
      console.error('Error fetching sectors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addSectorToFarm = async () => {
    setIsLoading(true);
    try {
      const res = await axios.post(`${API_URL}/sector/addSector`, {
        farmId,
        deviceId,
        userId,
      });
      const newSectorId = res.data.sectorId;
      console.log(newSectorId);

      // Update AsyncStorage
      let sectorList = await getStoredSectorList();

      // Add the new sector ID to sectorList
      sectorList.push(newSectorId);

      // Save updated sectorList back to AsyncStorage
      await AsyncStorage.setItem('sectorList', JSON.stringify(sectorList));

      // Refresh sectors list after adding a new sector
      fetchUserSectors();
    } catch (error) {
      Alert.alert(
        'Device already registered or not available',
        'Please try again',
      );
      console.error('Error adding sector:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSector = () => {
    setIsModalVisible(true);
  };

  const handleSelectSector = sectorId => {
    setSelectedSectors(prevSelected =>
      prevSelected.includes(sectorId)
        ? prevSelected.filter(id => id !== sectorId)
        : [...prevSelected, sectorId],
    );
  };

  const handleDeleteSector = () => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete the selected sector(s)? It would also unbind the link device',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Delete', onPress: () => deleteSelectedSectors()},
      ],
    );
  };

  const deleteSelectedSectors = async () => {
    try {
      const deleteRequests = selectedSectors.map(async sectorId => {
        await axios.delete(`${process.env.API_URL}/sector/deleteSector`, {
          params: {farmId: farmId, sectorId: sectorId},
        });
      });

      await Promise.all(deleteRequests);

      // Update AsyncStorage
      let sectorList = await getStoredSectorList();

      // Remove deleted sectors from sectorList
      sectorList = sectorList.filter(
        sectorId => !selectedSectors.includes(sectorId),
      );

      // Save updated sectorList back to AsyncStorage
      await AsyncStorage.setItem('sectorList', JSON.stringify(sectorList));

      // Update state
      setSectors(prevSectors =>
        prevSectors.filter(sector => !selectedSectors.includes(sector.id)),
      );
      setSelectedSectors([]);
    } catch (error) {
      console.error('Error deleting sectors:', error);
    }
  };

  const handleConfirmAddSector = async () => {
    setIsModalVisible(false);
    await addSectorToFarm();
    fetchUserSectors();
  };

  return (
    <View style={styles.container}>
      <BackButton />
      <TouchableOpacity style={styles.addButton} onPress={handleAddSector}>
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
          data={sectors}
          keyExtractor={item => item.id}
          renderItem={({item, index}) => (
            <View style={styles.sectorItem}>
              {isEditing && (
                <Checkbox
                  status={
                    selectedSectors.includes(item.id) ? 'checked' : 'unchecked'
                  }
                  onPress={() => handleSelectSector(item.id)}
                />
              )}
              <View style={styles.sectorDetails}>
                <Text style={styles.sectorName}>
                  Sector {index + 1}: {item.id}
                </Text>
                <Text>
                  Created At:{' '}
                  {item.createdAt
                    ? format(
                        convertToMYT(item.createdAt.getTime()),
                        'yyyy-MM-dd hh:mm:ss',
                      )
                    : 'N/A'}
                </Text>
              </View>
            </View>
          )}
        />
      )}
      {isEditing && selectedSectors.length > 0 && (
        <Button
          mode="contained"
          onPress={handleDeleteSector}
          style={styles.deleteButton}>
          Delete Selected Sectors
        </Button>
      )}

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Sector</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Device ID"
              value={deviceId}
              onChangeText={setDeviceId}
            />
            <View style={styles.modalButtons}>
              <Button
                mode="contained"
                onPress={handleConfirmAddSector}
                style={styles.modalButton}>
                Add Sector
              </Button>
              <Button
                mode="contained"
                onPress={() => setIsModalVisible(false)}
                style={styles.modalButton}>
                Cancel
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#d3e8d3',
  },
  sectorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  sectorDetails: {
    flex: 1,
    marginLeft: 10,
  },
  sectorName: {
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
  deleteButton: {
    marginBottom: 80,
    backgroundColor: 'red',
    color: '#FFF',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingLeft: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    marginHorizontal: 10,
    backgroundColor: '#4CAF50',
  },
});

export default UserSectorList;
