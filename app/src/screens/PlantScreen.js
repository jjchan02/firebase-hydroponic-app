import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {css} from '@emotion/native';
import Header from '../components/Header';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import {format} from 'date-fns';
import {eventEmitter} from '../utils/EventEmitter';
import {getStoredSectorList} from '../utils/LocalSectorList';
import {API_URL} from '@env';
import perf from '@react-native-firebase/perf';

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

const headerStyle = css`
  font-size: 24px;
  font-weight: bold;
  text-align: left;
`;

const addButtonStyle = css`
  position: absolute;
  right: 20px;
  bottom: 90px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 10px;
  background-color: #4caf50;
  border-radius: 50px;
  elevation: 5;
`;

const listContentContainerStyle = css`
  padding-bottom: 100px;
`;

const noSectorsContainer = css`
  flex: 1;
  align-items: center;
`;

const noSectorsText = css`
  font-size: 18px;
  color: gray;
`;

const PlantScreen = () => {
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibility, setVisibility] = useState({});
  const navigation = useNavigation();

  const convertToMYT = utcTimeInMs => {
    const utcDate = new Date(utcTimeInMs);
    const offset = utcDate.getTimezoneOffset() / 60; // Get UTC offset in hours
    const mytTimeInMs = utcTimeInMs + (offset + 8) * 60 * 60 * 1000; // Add 8 hours for MYT
    return new Date(mytTimeInMs);
  };

  async function customPlantScreenTrace() {
    try {
      const trace = await perf().startScreenTrace('plantScreen');
      await trace.stop();
    } catch (error) {
      console.error('Error starting the trace:', error);
    }
  }

  const fetchPlants = async () => {
    try {
      const sectorList = await getStoredSectorList();

      if (sectorList.length === 0) {
        setLoading(false);
        return;
      }

      const fetchedSectors = await Promise.all(
        sectorList.map(async (sectorId, index) => {
          const response = await axios.get(`${API_URL}/plant/getplants`, {
            params: {sectorId},
          });

          const data = response.data;
          const plantList = data.map(plant => ({
            id: plant.id,
            name: plant.name,
            ...plant,
            lastUpdate: plant.lastUpdate
              ? new Date(plant.lastUpdate._seconds * 1000)
              : null,
          }));

          return {
            sectorId,
            sectorName: `Sector ${index + 1}`,
            plants: plantList,
          };
        }),
      );

      const initialVisibility = fetchedSectors.reduce((acc, sector) => {
        acc[sector.sectorId] = true;
        return acc;
      }, {});

      setSectors(fetchedSectors);
      setVisibility(initialVisibility);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPlants();
    }, []),
  );

  useEffect(() => {
    customPlantScreenTrace();
    const handleNewPlant = () => {
      fetchPlants();
    };

    eventEmitter.on('newPlant', handleNewPlant);

    return () => {
      eventEmitter.off('newPlant', handleNewPlant);
    };
  }, []);

  const toggleVisibility = sectorId => {
    setVisibility(prevState => ({
      ...prevState,
      [sectorId]: !prevState[sectorId],
    }));
  };

  const renderItem = ({item}) => (
    <TouchableOpacity
      style={styles.plantItem}
      onPress={() =>
        navigation.navigate('PlantDetail', {
          plantId: item.id,
          sectorId: item.sectorId,
        })
      }>
      <Image source={{uri: item.imageUrl}} style={styles.plantImage} />
      <View style={styles.plantDetails}>
        <Text style={styles.plantName}>{item.name}</Text>
        <Text style={styles.plantStatus}>Status: {item.status}</Text>
        <Text style={styles.plantLastUpdate}>
          Last Update:{' '}
          {item.lastUpdate
            ? format(
                convertToMYT(item.lastUpdate.getTime()),
                'yyyy-MM-dd hh:mm:ss',
              )
            : 'N/A'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={containerStyle}>
      <Header navigation={navigation} />
      <View style={headerContainerStyle}>
        <Text style={headerStyle}>Plants</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : sectors.length === 0 ? (
        <View style={noSectorsContainer}>
          <Text style={noSectorsText}>No sectors available.</Text>
        </View>
      ) : (
        <FlatList
          data={sectors}
          keyExtractor={item => item.sectorId}
          contentContainerStyle={listContentContainerStyle}
          renderItem={({item}) => (
            <View>
              <TouchableOpacity
                style={styles.sectorHeader}
                onPress={() => toggleVisibility(item.sectorId)}>
                <Text style={styles.sectorTitle}>{item.sectorName}</Text>
                <Icon
                  name={
                    visibility[item.sectorId] ? 'expand-less' : 'expand-more'
                  }
                  size={24}
                  color="#000"
                />
              </TouchableOpacity>
              {visibility[item.sectorId] && (
                <FlatList
                  data={item.plants}
                  keyExtractor={plant => plant.id}
                  renderItem={renderItem}
                />
              )}
            </View>
          )}
        />
      )}
      <TouchableOpacity
        style={addButtonStyle}
        onPress={() => navigation.navigate('AddPlant')}>
        <Icon name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  plantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    margin: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    elevation: 3,
  },
  plantImage: {
    width: 90,
    height: 90,
    borderRadius: 10,
    marginRight: 15,
  },
  plantDetails: {
    flex: 1,
  },
  plantName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  plantStatus: {
    fontSize: 16,
    color: 'gray',
  },
  plantLastUpdate: {
    fontSize: 14,
    color: 'gray',
  },
  sectorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 10,
    color: 'white',
    padding: 5,
  },
  sectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 5,
    backgroundColor: '#4caf50',
    borderRadius: 5,
    marginVertical: 5,
  },
});

export default PlantScreen;
