import AsyncStorage from '@react-native-async-storage/async-storage';

const getStoredMessageToken = async () => {
  try {
    const messagingToken = await AsyncStorage.getItem('messaging-token');
    console.log(messagingToken);
    return messagingToken;
  } catch (error) {
    console.error('Error retrieving sector list from AsyncStorage:', error);
    return [];
  }
};

module.exports = {
  getStoredMessageToken,
};
