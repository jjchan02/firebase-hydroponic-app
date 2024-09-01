import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {css} from '@emotion/native';
import Header from '../components/Header';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useNavigation} from '@react-navigation/native';
import {getAuth} from '@react-native-firebase/auth';
import axios from 'axios';
import {API_URL} from '@env';

const containerStyle = css`
  flex: 1;
  padding: 20px;
  background-color: #d3e8d3;
`;

const headerContainerStyle = css`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const iconContainerStyle = css`
  flex-direction: row;
  align-items: center;
`;

const headerStyle = css`
  font-size: 24px;
  font-weight: bold;
`;

const contentHeaderStyle = css`
  font-size: 22px;
  font-weight: bold;
  color: black;
  padding: 10px;
`;

const contentTextStyle = css`
  font-size: 18px;
`;

const reminderItemStyle = css`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
  margin-bottom: 10px;
  background-color: #fff;
  border-radius: 5px;
`;

const reminderWarningItemStyle = css`
  ${reminderItemStyle};
  background-color: #ffcccb; /* light red background for warnings */
`;

const reminderTextContainerStyle = css`
  flex: 1;
  margin-left: 10px;
`;

const reminderTitleStyle = css`
  font-size: 18px;
  font-weight: bold;
  color: black;
`;

const reminderContentStyle = css`
  font-size: 14px;
  color: #555;
`;

const reminderDateTimeStyle = css`
  font-size: 14px;
  color: #888;
`;

const modalContentStyle = css`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
`;

const modalInnerContentStyle = css`
  width: 90%;
  padding: 20px;
  background-color: #fff;
  border-radius: 10px;
  align-items: center;
`;

const buttonStyle = css`
  background-color: #4caf50;
  padding: 10px 20px;
  border-radius: 5px;
  margin-top: 20px;
`;

const ReminderScreen = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedReminders, setSelectedReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    fetchNotification();
  }, []);

  const fetchNotification = async () => {
    setLoading(true);
    try {
      const userId = getAuth().currentUser?.uid;
      const response = await axios.get(`${API_URL}/message/getNotification`, {
        params: {userId},
      });
      if (response.status === 200) {
        setReminders(response.data.notificationList || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteSelectedNotifications = async () => {
    try {
      const userId = getAuth().currentUser?.uid;
      await axios.delete(`${API_URL}/message/deleteNotification`, {
        data: {userId, notificationIds: selectedReminders},
      });
      Alert.alert('Success', 'Selected notifications deleted successfully.');
      fetchNotification();
      setSelectedReminders([]);
      setIsEditing(false);
    } catch (error) {
      console.error('Error deleting selected notifications:', error);
    }
  };

  const handleSelectReminder = reminderId => {
    setSelectedReminders(prevSelected =>
      prevSelected.includes(reminderId)
        ? prevSelected.filter(id => id !== reminderId)
        : [...prevSelected, reminderId],
    );
  };

  const openModal = reminder => {
    setSelectedReminder(reminder);
    setModalVisible(true);
  };

  const closeModal = () => {
    setSelectedReminder(null);
    setModalVisible(false);
  };

  if (loading) {
    return (
      <View style={{flex: 1, padding: 40}}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={{flex: 1}}>
      <ScrollView
        style={containerStyle}
        contentContainerStyle={{paddingBottom: 150}}>
        <Header navigation={navigation} />
        <View style={headerContainerStyle}>
          <Text style={headerStyle}>Notification</Text>
          <View style={iconContainerStyle}>
            <TouchableOpacity
              style={{marginRight: 8}}
              onPress={() => {
                setLoading(true);
                fetchNotification();
              }}>
              <Icon name="refresh" size={28} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
              <Icon name="edit" size={28} color="black" />
            </TouchableOpacity>
          </View>
        </View>
        {reminders.length > 0 ? (
          reminders.map(reminder => (
            <TouchableOpacity
              key={reminder.id}
              style={
                reminder.type === 'warning'
                  ? reminderWarningItemStyle
                  : reminderItemStyle
              }
              onPress={() => openModal(reminder)}>
              {isEditing && (
                <TouchableOpacity
                  onPress={() => handleSelectReminder(reminder.id)}>
                  <Icon
                    name={
                      selectedReminders.includes(reminder.id)
                        ? 'check-box'
                        : 'check-box-outline-blank'
                    }
                    size={24}
                    color="black"
                  />
                </TouchableOpacity>
              )}
              <View style={reminderTextContainerStyle}>
                <Text style={reminderTitleStyle}>{reminder.title}</Text>
                <Text style={reminderContentStyle}>{reminder.content}</Text>
                <Text style={reminderDateTimeStyle}>
                  {reminder.date} at {reminder.time}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={contentTextStyle}>No notifications available.</Text>
        )}
        <Modal visible={modalVisible} transparent={true} animationType="slide">
          <View style={modalContentStyle}>
            <View style={modalInnerContentStyle}>
              <Text style={contentHeaderStyle}>{selectedReminder?.title}</Text>
              {selectedReminder?.type === 'normal' ? (
                <>
                  <Text style={contentTextStyle}>
                    {selectedReminder?.content}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={contentTextStyle}>
                    {selectedReminder?.content}
                  </Text>
                </>
              )}
              <TouchableOpacity style={buttonStyle} onPress={closeModal}>
                <Text style={{color: '#fff'}}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
      {isEditing && selectedReminders.length > 0 && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            Alert.alert(
              'Confirm Delete',
              'Are you sure you want to delete the selected notifications?',
              [
                {text: 'Cancel', style: 'cancel'},
                {
                  text: 'OK',
                  onPress: deleteSelectedNotifications,
                },
              ],
            );
          }}>
          <Text style={styles.deleteButtonText}>
            Delete Selected Notifications
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  deleteButton: {
    position: 'absolute',
    bottom: 80, // Adjust this to ensure it's above the bottom tab bar
    left: 20,
    right: 20,
    backgroundColor: '#f44336',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ReminderScreen;
