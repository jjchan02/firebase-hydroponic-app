import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import {css} from '@emotion/native';
import BackButton from '../components/BackButton';
import PROFILE_IMAGE from '../assets/images/profile.png';
import {useNavigation} from '@react-navigation/native';
import axios from 'axios';
import {
  getAuth,
  updatePassword,
  signOut,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from '@react-native-firebase/auth';
import {API_URL} from '@env';

const containerStyle = css`
  flex: 1;
  padding: 20px;
  background-color: #d3e8d3;
  align-items: center;
`;

const profileContainerStyle = css`
  align-items: center;
  margin-bottom: 30px;
`;

const avatarStyle = css`
  width: 100px;
  height: 100px;
  border-radius: 50px;
  background-color: #ccc;
  margin-bottom: 10px;
`;

const emailStyle = css`
  font-size: 20px;
  font-weight: bold;
`;

const buttonStyle = css`
  width: 80%;
  padding: 15px;
  margin: 10px 10px;
  border-radius: 10px;
  background-color: #fff;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const buttonText = css`
  font-size: 16px;
`;

const modalContainerStyle = css`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
`;

const modalContentStyle = css`
  width: 93%;
  padding: 20px;
  background-color: #fff;
  border-radius: 10px;
  elevation: 5;
`;

const inputContainerStyle = css`
  margin-bottom: 20px;
`;

const inputStyle = css`
  width: 100%;
  padding: 10px;
  border-width: 1px;
  border-color: #ccc;
  border-radius: 5px;
  background-color: #fff;
`;

const auth = getAuth();

const UserProfile = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isChangeEmail, setIsChangeEmail] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setEmail(user.email);
    }
  }, []);

  const handleSave = async () => {
    try {
      const user = auth.currentUser;

      if (isChangeEmail) {
        await axios.post(`${API_URL}/user/updateEmail`, {
          uid: user.uid,
          newEmail,
        });

        // Alert the user about email change and verification email
        Alert.alert(
          'Success',
          'Email updated successfully. Please sign in again.',
        );

        // Log out the user
        await signOut(auth);

        // Clear email state
        setEmail('');
        setNewEmail('');
      } else {
        const credential = EmailAuthProvider.credential(
          user.email,
          oldPassword,
        );
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
        Alert.alert(
          'Success',
          'Password updated successfully. Please sign in again.',
        );
        // Log out the user
        await signOut(auth);

        setOldPassword('');
        setNewPassword('');
      }
      setModalVisible(false);
    } catch (error) {
      console.error('Error updating email or password:', error);
      Alert.alert('Error', 'Failed to update email or password.');
    }
  };

  const handleCancel = () => {
    setModalVisible(false);
  };

  return (
    <View style={containerStyle}>
      <BackButton />
      <View style={profileContainerStyle}>
        <Image source={PROFILE_IMAGE} style={avatarStyle} />
        <Text style={emailStyle}>{email}</Text>
      </View>
      <TouchableOpacity
        style={buttonStyle}
        onPress={() => {
          setIsChangeEmail(true);
          setModalVisible(true);
        }}>
        <Text style={buttonText}>Change Email</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={buttonStyle}
        onPress={() => {
          setIsChangeEmail(false);
          setModalVisible(true);
        }}>
        <Text style={buttonText}>Change Password</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={buttonStyle}
        onPress={() => navigation.navigate('Notification')}>
        <Text style={buttonText}>Notification Settings</Text>
      </TouchableOpacity>
      <TouchableOpacity style={buttonStyle} onPress={() => signOut(auth)}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={modalContainerStyle}>
          <View style={modalContentStyle}>
            {isChangeEmail ? (
              <>
                <Text style={styles.label}>New Email</Text>
                <View style={inputContainerStyle}>
                  <TextInput
                    style={inputStyle}
                    placeholder="New Email"
                    value={newEmail}
                    onChangeText={setNewEmail}
                  />
                </View>
              </>
            ) : (
              <>
                <Text style={styles.label}>Old Password</Text>
                <View style={inputContainerStyle}>
                  <TextInput
                    style={inputStyle}
                    placeholder="Old Password"
                    value={oldPassword}
                    secureTextEntry={true}
                    onChangeText={setOldPassword}
                  />
                </View>
                <Text style={styles.label}>New Password</Text>
                <View style={inputContainerStyle}>
                  <TextInput
                    style={inputStyle}
                    placeholder="New Password"
                    value={newPassword}
                    secureTextEntry={true}
                    onChangeText={setNewPassword}
                  />
                </View>
              </>
            )}
            <View
              style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              <TouchableOpacity style={styles.modalButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Confirm</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalButton: {
    flex: 1,
    padding: 15,
    margin: 5,
    backgroundColor: 'white',
    borderRadius: 5,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#4CAF50',
    fontSize: 16,
  },
  cancelButtonText: {
    color: '#f44336',
    fontSize: 16,
  },
  logoutButtonText: {
    fontSize: 16,
    color: 'red',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
});

export default UserProfile;
