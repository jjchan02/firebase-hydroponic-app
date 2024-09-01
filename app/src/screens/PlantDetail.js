import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  Button,
  Alert,
  StyleSheet,
} from 'react-native';
import {css} from '@emotion/native';
import BackButton from '../components/BackButton';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import {format} from 'date-fns';
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

const infoTextStyle = css`
  font-size: 16px;
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

const inputStyle = css`
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  background-color: #fff;
  border-radius: 5px;
`;

const PlantDetail = ({route, navigation}) => {
  const {plantId, sectorId} = route.params;
  const [plant, setPlant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newRecord, setNewRecord] = useState({
    date: '',
    observation: '',
    measurement: '',
  });
  const [newImportantDate, setNewImportantDate] = useState({
    date: '',
    note: '',
  });
  const [modalType, setModalType] = useState('');

  const fetchPlant = async () => {
    try {
      const response = await axios.get(`${API_URL}/plant/plants/${plantId}`);
      const data = response.data;
      const convertedRecords = data.records.map(record => ({
        ...record,
        date: record.date ? new Date(record.date._seconds * 1000) : 'None',
      }));

      setPlant({
        name: data.name,
        status: data.status,
        imageUrl: data.imageUrl,
        lastUpdate: data.lastUpdate
          ? new Date(data.lastUpdate._seconds * 1000)
          : 'None',
        dateAdded: data.dateAdded
          ? new Date(data.dateAdded._seconds * 1000)
          : 'None',
        records: convertedRecords,
        importantDates: data.importantDates || [],
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching plant:', error);
      setLoading(false);
    }
  };

  const deletePlant = async () => {
    Alert.alert('Delete Plant', 'Are you sure you want to delete this plant?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        onPress: async () => {
          try {
            await axios.delete(`${API_URL}/plant/deleteplant`, {
              params: {plantId, sectorId},
            });
            navigation.goBack();
          } catch (error) {
            console.error('Error deleting plant:', error);
            Alert.alert('Error', 'Failed to delete plant.');
          }
        },
      },
    ]);
  };

  const handleAddRecord = () => {
    setModalType('record');
    setModalVisible(true);
  };

  const handleAddImportantDate = () => {
    setModalType('importantDate');
    setModalVisible(true);
  };

  const convertToMYT = utcTimeInMs => {
    const utcDate = new Date(utcTimeInMs);
    const offset = utcDate.getTimezoneOffset() / 60; // Get UTC offset in hours
    const mytTimeInMs = utcTimeInMs + (offset + 8) * 60 * 60 * 1000; // Add 8 hours for MYT
    return new Date(mytTimeInMs);
  };

  const saveNewRecord = async () => {
    if (!newRecord.observation.trim() || !newRecord.measurement.trim()) {
      Alert.alert(
        'Invalid Input',
        'Observation or Measurement cannot be blank.',
      );
      return;
    }

    try {
      const recordData = {
        date: new Date(),
        observation: newRecord.observation,
        measurement: newRecord.measurement,
      };
      await axios.post(
        `${API_URL}/plant/plants/${plantId}/records`,
        recordData,
      );
      setPlant(prevPlant => ({
        ...prevPlant,
        records: [...prevPlant.records, recordData],
      }));
      setModalVisible(false);
      setNewRecord({observation: '', measurement: ''});
    } catch (error) {
      console.error('Error saving new record:', error);
      Alert.alert('Error', 'Failed to save new record.');
    }
  };

  const validateDate = date => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    return dateRegex.test(date);
  };

  const saveNewImportantDate = async () => {
    if (!newImportantDate.date.trim() || !newImportantDate.note.trim()) {
      Alert.alert('Invalid Input', 'Date or Note cannot be blank.');
      return;
    }

    if (!validateDate(newImportantDate.date)) {
      Alert.alert(
        'Invalid Date',
        'Please enter a date in the format yyyy-MM-dd.',
      );
      return;
    }

    try {
      const importantDateData = {
        date: newImportantDate.date,
        note: newImportantDate.note,
      };
      await axios.post(
        `${API_URL}/plant/plants/${plantId}/importantDates`,
        importantDateData,
      );
      setPlant(prevPlant => ({
        ...prevPlant,
        importantDates: [...prevPlant.importantDates, importantDateData],
      }));
      setModalVisible(false);
      setNewImportantDate({date: '', note: ''});
    } catch (error) {
      console.error('Error saving new important date:', error);
      Alert.alert('Error', 'Failed to save new important date.');
    }
  };

  useEffect(() => {
    fetchPlant();
  }, []);

  if (loading) {
    return (
      <View style={containerStyle}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <ScrollView style={containerStyle}>
      <View style={headerStyle}>
        <BackButton />
        <View style={{flexDirection: 'row'}}>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('EditPlantDetail', {
                plant,
                plantId: plantId,
              })
            }>
            <Icon
              name="edit"
              size={25}
              color="black"
              style={{marginRight: 10}}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={deletePlant}>
            <Icon
              name="delete"
              size={25}
              color="black"
              style={{marginRight: 5}}
            />
          </TouchableOpacity>
        </View>
      </View>
      {plant && (
        <>
          <Image source={{uri: plant.imageUrl}} style={imageStyle} />
          <Text style={{fontSize: 20, fontWeight: 'bold', marginVertical: 10}}>
            {plant.name}
          </Text>
          <Text style={infoTextStyle}>Status: {plant.status}</Text>
          <Text style={infoTextStyle}>
            Last Update:{' '}
            {plant.lastUpdate !== 'None'
              ? format(
                  convertToMYT(plant.lastUpdate.getTime()),
                  'yyyy-MM-dd HH:mm:ss',
                )
              : 'None'}
          </Text>
          <Text style={sectionTitleStyle}>Observations & Measurements</Text>
          {plant.records.length > 0 ? (
            plant.records.map((record, index) => (
              <View key={index} style={recordItemStyle}>
                <Text style={infoTextStyle}>
                  Date:{' '}
                  {record.date !== 'None'
                    ? format(
                        convertToMYT(record.date.getTime()),
                        'yyyy-MM-dd HH:mm:ss',
                      )
                    : 'None'}
                </Text>
                <Text style={infoTextStyle}>
                  Observation: {record.observation}
                </Text>
                <Text style={infoTextStyle}>
                  Measurement: {record.measurement}
                </Text>
              </View>
            ))
          ) : (
            <Text style={infoTextStyle}>No records available</Text>
          )}
          <TouchableOpacity onPress={handleAddRecord} style={styles.addButton}>
            <Text style={styles.addButtonText}>Add Record</Text>
          </TouchableOpacity>
          <Text style={sectionTitleStyle}>Tasks</Text>
          {plant.importantDates.length > 0 ? (
            plant.importantDates.map((importantDate, index) => (
              <View key={index} style={recordItemStyle}>
                <Text style={infoTextStyle}>Date: {importantDate.date}</Text>
                <Text style={infoTextStyle}>Note: {importantDate.note}</Text>
              </View>
            ))
          ) : (
            <Text style={infoTextStyle}>No tasks available</Text>
          )}
          <TouchableOpacity
            onPress={handleAddImportantDate}
            style={styles.addButton}>
            <Text style={styles.addButtonText}>Add Task</Text>
          </TouchableOpacity>
          <View style={{padding: 30}}></View>
        </>
      )}

      <Modal
        transparent={true}
        animationType="slide"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {modalType === 'record' ? 'Add Record' : 'Add Task'}
            </Text>
            {modalType === 'record' ? (
              <>
                <TextInput
                  placeholder="Observation"
                  value={newRecord.observation}
                  onChangeText={text =>
                    setNewRecord({...newRecord, observation: text})
                  }
                  style={inputStyle}
                />
                <TextInput
                  placeholder="Measurement"
                  value={newRecord.measurement}
                  onChangeText={text =>
                    setNewRecord({...newRecord, measurement: text})
                  }
                  style={inputStyle}
                />
              </>
            ) : (
              <>
                <TextInput
                  placeholder="Date Eg: 2024-06-29"
                  value={newImportantDate.date}
                  onChangeText={text =>
                    setNewImportantDate({...newImportantDate, date: text})
                  }
                  style={inputStyle}
                />
                <TextInput
                  placeholder="Note"
                  value={newImportantDate.note}
                  onChangeText={text =>
                    setNewImportantDate({...newImportantDate, note: text})
                  }
                  style={inputStyle}
                />
              </>
            )}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: 20,
              }}>
              <TouchableOpacity
                onPress={
                  modalType === 'record' ? saveNewRecord : saveNewImportantDate
                }
                style={styles.modalButton}>
                <Text
                  style={{fontSize: 16, fontWeight: 'bold', color: 'green'}}>
                  Save
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalButton}>
                <Text style={{fontSize: 16, fontWeight: 'bold', color: 'red'}}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={{marginTop: 50}}></View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalButton: {
    flex: 1,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  addButton: {
    width: '100%',
    padding: 13,
    backgroundColor: '#4caf50',
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inputStyle: {
    width: '100%',
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
  },
});

export default PlantDetail;
