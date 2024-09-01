import AsyncStorage from '@react-native-async-storage/async-storage';

const getStoredSectorList = async () => {
  try {
    const sectorListString = await AsyncStorage.getItem('sectorList');
    if (sectorListString) {
      const sectorList = JSON.parse(sectorListString);
      console.log('Stored sector list:', sectorList);
      return sectorList;
    }
    return [];
  } catch (error) {
    console.error('Error retrieving sector list from AsyncStorage:', error);
    return [];
  }
};

module.exports = {
  getStoredSectorList,
};
