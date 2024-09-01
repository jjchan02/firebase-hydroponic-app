import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  StyleSheet,
} from 'react-native';
import {css} from '@emotion/native';
import BackButton from '../components/BackButton';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import axios from 'axios';
import {eventEmitter} from '../utils/EventEmitter';
import {getStoredSectorList} from '../utils/LocalSectorList';
import {Picker} from '@react-native-picker/picker';
import {API_URL} from '@env';

const containerStyle = css`
  flex: 1;
  background-color: #d3e8d3;
  padding: 20px;
`;

const headerStyle = css`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const uploadContainerStyle = css`
  width: 100%;
  height: 150px;
  margin-bottom: 20px;
  justify-content: center;
  align-items: center;
  background-color: #fff;
  border-radius: 5px;
`;

const uploadTextStyle = css`
  font-size: 18px;
  color: #aaa;
`;

const inputStyle = css`
  width: 100%;
  padding: 10px;
  margin-bottom: 20px;
  background-color: #fff;
  border-radius: 5px;
`;

const AddPlant = ({navigation}) => {
  const [image, setImage] = useState(null);
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [sectors, setSectors] = useState([]);
  const [selectedSector, setSelectedSector] = useState('');

  useEffect(() => {
    const fetchSectors = async () => {
      try {
        const sectorList = await getStoredSectorList();
        const sectorsWithLabels = sectorList.map((sector, index) => ({
          id: sector,
          label: `Sector ${index + 1}`,
        }));
        setSectors(sectorsWithLabels);
        if (sectorList.length > 0) {
          setSelectedSector(sectorsWithLabels[0].id);
        }
      } catch (error) {
        console.error('Error fetching sectors:', error);
      }
    };

    fetchSectors();
  }, []);

  const handleImagePicker = () => {
    setModalVisible(true);
  };

  const pickImageFromCamera = () => {
    launchCamera({mediaType: 'photo'}, response => {
      if (!response.didCancel && !response.error) {
        setImage({uri: response.assets[0].uri});
      }
    });
    setModalVisible(false);
  };

  const pickImageFromGallery = () => {
    launchImageLibrary({mediaType: 'photo'}, response => {
      if (!response.didCancel && !response.error) {
        setImage({uri: response.assets[0].uri});
      }
    });
    setModalVisible(false);
  };

  const handleSave = async () => {
    if (!name || !status || !selectedSector) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('status', status);
      formData.append('image', {
        uri: image.uri,
        type: 'image/jpeg', // You can change this based on your image type
        name: 'plant.jpg',
      });
      const response = await axios.post(
        `${API_URL}/plant/addplant/${selectedSector}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      if (response.status === 200) {
        Alert.alert('Success', 'Plant added successfully!');
        eventEmitter.emit('newPlant'); // Emit the custom event
        navigation.goBack();
      } else {
        Alert.alert('Error', 'Failed to add plant.');
        console.error('API response:', response.data);
      }
    } catch (error) {
      console.error('Error adding plant:', error);
      Alert.alert('Error', 'An error occurred while adding the plant.');
    }
  };

  return (
    <View style={containerStyle}>
      <BackButton navigation={navigation} />
      <View style={headerStyle}>
        <Text style={{fontSize: 24, fontWeight: 'bold'}}>Add Plant</Text>
      </View>
      <TouchableOpacity
        style={uploadContainerStyle}
        onPress={handleImagePicker}>
        {image ? (
          <Image source={image} style={{width: '100%', height: '100%'}} />
        ) : (
          <Text style={uploadTextStyle}>Tap to upload image</Text>
        )}
      </TouchableOpacity>
      <TextInput
        style={inputStyle}
        placeholder="Plant Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={inputStyle}
        placeholder="Status"
        value={status}
        onChangeText={setStatus}
      />
      <View style={inputStyle}>
        <Picker
          selectedValue={selectedSector}
          onValueChange={itemValue => setSelectedSector(itemValue)}>
          {sectors.map(sector => (
            <Picker.Item
              key={sector.id}
              label={sector.label}
              value={sector.id}
            />
          ))}
        </Picker>
      </View>
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={pickImageFromCamera}>
              <Text style={styles.modalOption}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={pickImageFromGallery}>
              <Text style={styles.modalOption}>Choose from Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalOption}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
  },
  modalOption: {
    fontSize: 18,
    padding: 10,
    textAlign: 'center',
  },
});

export default AddPlant;
