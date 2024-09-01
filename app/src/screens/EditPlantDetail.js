import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  StyleSheet,
} from 'react-native';
import {css} from '@emotion/native';
import BackButton from '../components/BackButton';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import axios from 'axios';
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
  margin-bottom: 20px;
`;

const imageStyle = css`
  width: 150px;
  height: 150px;
  margin-bottom: 20px;
  align-self: center;
`;

const inputStyle = css`
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  background-color: #fff;
  border-radius: 5px;
`;

const infoTextStyle = css`
  font-size: 18px;
  margin-bottom: 5px;
`;

const sectionTitleStyle = css`
  font-size: 20px;
  font-weight: bold;
  margin-vertical: 10px;
`;

const recordItemStyle = css`
  background-color: #fff;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 10px;
`;

const buttonStyle = css`
  padding: 5px;
`;

const EditPlantDetail = ({route, navigation}) => {
  const {plant: initialPlant, plantId} = route.params;
  const [plant, setPlant] = useState(initialPlant);
  const [status, setStatus] = useState(initialPlant.status);
  const [records, setRecords] = useState(initialPlant.records);
  const [importantDates, setImportantDates] = useState(
    initialPlant.importantDates,
  );

  const [modalVisible, setModalVisible] = useState(false);

  const handleImagePicker = () => {
    setModalVisible(true);
  };

  const pickImageFromCamera = () => {
    launchCamera({mediaType: 'photo'}, response => {
      if (!response.didCancel && !response.error) {
        setPlant({...plant, imageUrl: response.assets[0].uri});
      }
    });
    setModalVisible(false);
  };

  const pickImageFromGallery = () => {
    launchImageLibrary({mediaType: 'photo'}, response => {
      if (!response.didCancel && !response.error) {
        setPlant({...plant, imageUrl: response.assets[0].uri});
      }
    });
    setModalVisible(false);
  };

  const handleSave = async () => {
    Alert.alert('Save Changes', 'Are you sure you want to save the changes?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Save',
        onPress: async () => {
          try {
            await axios.put(`${API_URL}/plant/updateplant/${plantId}`, {
              status,
              imageUrl: plant.imageUrl,
              records,
              importantDates,
            });
            navigation.navigate('Plant');
          } catch (error) {
            console.error('Error updating plant:', error);
            Alert.alert('Error', 'Failed to save changes.');
          }
        },
      },
    ]);
  };

  const handleDeleteRecord = (index, type) => {
    Alert.alert(
      'Delete Record',
      'Are you sure you want to delete this record?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          onPress: () => {
            if (type === 'record') {
              setRecords(records.filter((_, i) => i !== index));
            } else if (type === 'importantDate') {
              setImportantDates(importantDates.filter((_, i) => i !== index));
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={containerStyle}>
      <View style={headerStyle}>
        <BackButton />
        <TouchableOpacity onPress={handleSave}>
          <Icon name="save" size={25} color="black" style={{marginRight: 5}} />
        </TouchableOpacity>
      </View>
      <Text style={sectionTitleStyle}>Select to Change Image</Text>
      <TouchableOpacity onPress={handleImagePicker}>
        <Image source={{uri: plant.imageUrl}} style={imageStyle} />
      </TouchableOpacity>
      <Text style={sectionTitleStyle}>Status</Text>
      <TextInput
        placeholder="Status"
        value={status}
        onChangeText={setStatus}
        style={inputStyle}
      />
      <Text style={sectionTitleStyle}>Observations & Measurements</Text>
      {records.map((record, index) => (
        <View key={index} style={recordItemStyle}>
          <TextInput
            placeholder="Observation"
            value={record.observation}
            onChangeText={text => {
              const newRecords = [...records];
              newRecords[index].observation = text;
              setRecords(newRecords);
            }}
            style={inputStyle}
          />
          <TextInput
            placeholder="Measurement"
            value={record.measurement}
            onChangeText={text => {
              const newRecords = [...records];
              newRecords[index].measurement = text;
              setRecords(newRecords);
            }}
            style={inputStyle}
          />
          <View style={{flexDirection: 'row', justifyContent: 'flex-end'}}>
            <TouchableOpacity
              style={buttonStyle}
              onPress={() => handleDeleteRecord(index, 'record')}>
              <Icon name="delete" size={25} color="black" />
            </TouchableOpacity>
          </View>
        </View>
      ))}
      <Text style={sectionTitleStyle}>Tasks</Text>
      {importantDates.map((importantDate, index) => (
        <View key={index} style={recordItemStyle}>
          <Text style={infoTextStyle}>{importantDate.date}</Text>
          <Text style={infoTextStyle}> - {importantDate.note}</Text>
          <View style={{flexDirection: 'row', justifyContent: 'flex-end'}}>
            <TouchableOpacity
              style={buttonStyle}
              onPress={() => handleDeleteRecord(index, 'importantDate')}>
              <Icon name="delete" size={25} color="black" />
            </TouchableOpacity>
          </View>
        </View>
      ))}
      <View style={{margin: 50}}></View>
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
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

export default EditPlantDetail;
