import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {css} from '@emotion/native';
import BackButton from '../components/BackButton';
import axios from 'axios';
import {getAuth} from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useNavigation} from '@react-navigation/native';
import {API_URL} from '@env';

const containerStyle = css`
  flex: 1;
  padding: 20px;
  background-color: #d3e8d3;
`;

const headerStyle = css`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const settingContainerStyle = css`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom-width: 1px;
  border-bottom-color: #ccc;
  margin-left: 20px;
`;

const settingTextStyle = css`
  font-size: 16px;
`;

const fetchNotificationSettings = async () => {
  try {
    const userId = getAuth().currentUser?.uid;
    const response = await axios.get(`${API_URL}/user/getUser`, {
      params: {userId},
    });

    if (response.status === 200) {
      const {notificationSettings} = response.data;
      return notificationSettings;
    } else {
      console.error('Failed to fetch notification settings');
      return null;
    }
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return null;
  }
};

const saveNotificationSettings = async newSettings => {
  try {
    const userId = getAuth().currentUser?.uid;
    const response = await axios.post(`${API_URL}/user/updateUserSettings`, {
      userId,
      notificationSettings: newSettings,
    });

    if (response.status !== 200) {
      console.error('Failed to save notification settings');
    }
  } catch (error) {
    console.error('Error saving notification settings:', error);
  }
};

const NotificationSettings = () => {
  const [harvestReminder, setHarvestReminder] = useState(null);
  const [anomalyAlert, setAnomalyAlert] = useState(null);
  const [dailyCheckoutReminder, setDailyCheckoutReminder] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await fetchNotificationSettings();
      if (settings) {
        setHarvestReminder(settings[0]);
        setAnomalyAlert(settings[1]);
        setDailyCheckoutReminder(settings[2]);
      }
      setLoading(false);
    };

    loadSettings();
  }, []);

  const handleSaveSettings = () => {
    const newSettings = [harvestReminder, anomalyAlert, dailyCheckoutReminder];
    saveNotificationSettings(newSettings);
    navigation.navigate('UserProfile');
  };

  if (loading) {
    return (
      <View style={containerStyle}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <View style={headerStyle}>
        <BackButton />
        <TouchableOpacity onPress={handleSaveSettings}>
          <Icon name="save" size={25} color="black" style={{marginRight: 5}} />
        </TouchableOpacity>
      </View>
      <View style={settingContainerStyle}>
        <Text style={settingTextStyle}>Reminders on Recorded Tasks</Text>
        <Switch value={harvestReminder} onValueChange={setHarvestReminder} />
      </View>
      <View style={settingContainerStyle}>
        <Text style={settingTextStyle}>Alerts on Anomaly Detection</Text>
        <Switch value={anomalyAlert} onValueChange={setAnomalyAlert} />
      </View>
      <View style={settingContainerStyle}>
        <Text style={settingTextStyle}>Reminders on Daily Checkout</Text>
        <Switch
          value={dailyCheckoutReminder}
          onValueChange={setDailyCheckoutReminder}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#d3e8d3',
  },
  settingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  settingText: {
    fontSize: 16,
  },
});

export default NotificationSettings;
