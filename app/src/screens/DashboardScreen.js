import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {TabView, SceneMap, TabBar} from 'react-native-tab-view';
import axios from 'axios';
import {getAuth} from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ParameterCard from '../components/ParameterCard';
import Header from '../components/Header';
import EventCard from '../components/EventCard';
import moment from 'moment';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {getStoredSectorList} from '../utils/LocalSectorList';
import {API_URL} from '@env';
import perf from '@react-native-firebase/perf';

const DashboardScreen = () => {
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [visibility, setVisibility] = useState({});
  const [sectors, setSectors] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    {key: 'parameters', title: 'Parameters'},
    {key: 'events', title: 'Tasks'},
  ]);
  const navigation = useNavigation();
  const [showOptions, setShowOptions] = useState(false);

  async function customDashboardScreenTrace() {
    try {
      const trace = await perf().startScreenTrace('dashboardScreen');
      await trace.stop();
    } catch (error) {
      console.error('Error starting the trace:', error);
    }
  }

  const fetchSelectedFarm = async () => {
    try {
      const userId = getAuth().currentUser?.uid;
      if (!userId) {
        console.error('User is not authenticated');
        return;
      }

      const farmRes = await axios.get(`${API_URL}/farm/getfarm/${userId}`);
      const farms = farmRes.data;

      if (farms.length > 0) {
        const selectedFarmId = await AsyncStorage.getItem('selectedFarm');
        const selectedFarm =
          farms.find(farm => farm.id === selectedFarmId) || farms[0];
        setSelectedFarm(selectedFarm);
      } else {
        console.error('No farms found for the user');
      }
    } catch (error) {
      console.error('Error fetching selected farm:', error);
    }
  };

  const fetchFarmDetails = async () => {
    try {
      const sectorList = await getStoredSectorList();

      if (sectorList && sectorList.length > 0) {
        const updatedSectors = await Promise.all(
          sectorList.map(async (sectorId, index) => {
            const sectorRes = await axios.get(
              `${API_URL}/sector/getLatestData/${sectorId}`,
            );
            const parameterData = sectorRes.data.latestData || {};

            // Fetch status
            const statusRes = await axios.get(
              `${API_URL}/sector/getStatus/${sectorId}`,
            );
            const {lastUpdate, status} = statusRes.data;
            console.log(lastUpdate, status);

            return {
              id: sectorId,
              name: `Sector ${index + 1}`,
              parameterData: {
                surroundingTemperature:
                  parameterData.surroundingTemperature?.value || 'N/A',
                surroundingHumidity:
                  parameterData.surroundingHumidity?.value || 'N/A',
                solutionTemperature:
                  parameterData.solutionTemperature?.value || 'N/A',
                pH: parameterData.pH?.value || 'N/A',
                tds: parameterData.tds?.value || 'N/A',
                lightIntensity: parameterData.lightIntensity?.value || 'N/A',
                foggerTemperature:
                  parameterData.foggerTemperature?.value || 'N/A',
                foggerHumidity: parameterData.foggerHumidity?.value || 'N/A',
                foggerTrigger: parameterData.foggerTrigger?.value || '0',
                lowTdsTrigger: parameterData.lowTdsTrigger?.value || '0',
                highTdsTrigger: parameterData.highTdsTrigger?.value || '0',
                lowPhTrigger: parameterData.lowPhTrigger?.value || '0',
                highPhTrigger: parameterData.highPhTrigger?.value || '0',
              },
              status, // Add the status
              // lastUpdate, // Add the last update time
              visible: true,
            };
          }),
        );

        const initialVisibility = updatedSectors.reduce((acc, sector) => {
          acc[sector.id] = false;
          return acc;
        }, {});

        setVisibility(initialVisibility);
        setSectors(updatedSectors);
      } else {
        setSectors([]); // No sectors available
      }

      setEvents([]); // Set dummy data for now
      setLoading(false);
    } catch (error) {
      console.error('Error fetching farm details:', error);
    }
  };

  const fetchImportantDates = async () => {
    try {
      const sectorList = await getStoredSectorList();

      if (sectorList && sectorList.length > 0) {
        const updatedEvents = await Promise.all(
          sectorList.map(async (sectorId, index) => {
            const plantRes = await axios.get(
              `${process.env.API_URL}/plant/getplants`,
              {
                params: {sectorId},
              },
            );
            const plants = plantRes.data;

            return plants.map(plant => ({
              sectorId,
              sectorName: `Sector ${index + 1}`,
              plantId: plant.id,
              importantDates: plant.importantDates,
            }));
          }),
        );

        const flattenedEvents = updatedEvents.flat();

        setEvents(flattenedEvents);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching important dates:', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchSelectedFarm();
    }, []),
  );

  useEffect(() => {
    customDashboardScreenTrace();
    if (selectedFarm) {
      fetchFarmDetails();
      fetchImportantDates();
    }
  }, [selectedFarm]);

  const toggleVisibility = sectorId => {
    setVisibility(prevState => ({
      ...prevState,
      [sectorId]: !prevState[sectorId],
    }));
  };

  const renderParameterScene = () => (
    <ScrollView contentContainerStyle={styles.parametersContainer}>
      {sectors.length > 0 ? (
        sectors.map(sector => (
          <View key={sector.id}>
            <TouchableOpacity
              style={styles.sectorHeader}
              onPress={() => toggleVisibility(sector.id)}>
              <Text style={styles.sectorHeaderText}>{sector.name}</Text>
              <Text
                style={[
                  styles.statusText,
                  sector.status === 'online' ? styles.online : styles.offline,
                ]}>
                {sector.status === 'online' ? 'Online' : 'Offline'}
              </Text>
              <Icon
                name={visibility[sector.id] ? 'expand-less' : 'expand-more'}
                size={24}
                color="white"
              />
            </TouchableOpacity>
            {visibility[sector.id] && (
              <View style={styles.sectorContainer}>
                <ParameterCard
                  label="Surrounding Temperature"
                  value={`${sector.parameterData.surroundingTemperature}°C`}
                />
                <ParameterCard
                  label="Surrounding Humidity"
                  value={`${sector.parameterData.surroundingHumidity}%`}
                />
                <ParameterCard
                  label="Solution Temperature"
                  value={`${sector.parameterData.solutionTemperature}°C`}
                />
                <ParameterCard
                  label="Solution pH Level"
                  value={`${sector.parameterData.pH}`}
                />
                <ParameterCard
                  label="Solution TDS Level"
                  value={`${sector.parameterData.tds} ppm`}
                />
                <ParameterCard
                  label="Light Intensity"
                  value={`${sector.parameterData.lightIntensity} lx`}
                />
                <ParameterCard
                  label="Fogger Temperature"
                  value={`${sector.parameterData.foggerTemperature} °C`}
                />
                <ParameterCard
                  label="Fogger Humidity"
                  value={`${sector.parameterData.foggerHumidity} %`}
                />
              </View>
            )}
          </View>
        ))
      ) : (
        <TouchableOpacity
          style={styles.addSectorButton}
          onPress={() =>
            navigation.navigate('SectorList', {farmId: selectedFarm.id})
          }>
          <Text style={styles.addSectorText}>Add Sector</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );

  const renderEventScene = () => (
    <ScrollView contentContainerStyle={styles.eventContainer}>
      {events.length > 0 ? (
        events.map((event, index) =>
          event.importantDates.map((dateInfo, dateIndex) => (
            <EventCard
              key={`${index}-${dateIndex}`}
              day={moment(dateInfo.date).format('dddd, MMMM D YYYY')}
              title={dateInfo.note}
              description={`${event.sectorName}`}
            />
          )),
        )
      ) : (
        <Text style={styles.noEventsText}>No tasks found.</Text>
      )}
    </ScrollView>
  );

  const renderScene = SceneMap({
    parameters: renderParameterScene,
    events: renderEventScene,
  });

  const renderOptions = () => (
    <View style={styles.optionsContainer}>
      <TouchableOpacity
        style={styles.optionItem}
        onPress={() => navigation.navigate('FarmList')}>
        <Text style={styles.optionText}>Edit Farm</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.optionItem}
        onPress={() =>
          navigation.navigate('SectorList', {farmId: selectedFarm.id})
        }>
        <Text style={styles.optionText}>Edit Sector</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header navigation={navigation} />
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Monitor Panel</Text>
        <View style={styles.iconContainer}>
          <TouchableOpacity
            style={styles.refreshIcon}
            onPress={() => {
              setLoading(true);
              fetchSelectedFarm();
            }}>
            <Icon name="refresh" size={26} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.moreIcon}
            onPress={() => setShowOptions(!showOptions)}>
            <Icon name="more-vert" size={26} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
      {selectedFarm && (
        <Text style={styles.currentFarmText}>
          Current Farm: {selectedFarm.name}
        </Text>
      )}
      {showOptions && (
        <View style={styles.optionsOverlay}>{renderOptions()}</View>
      )}
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <TabView
          navigationState={{index, routes}}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={{width: Dimensions.get('window').width}}
          renderTabBar={props => (
            <TabBar
              {...props}
              style={styles.tabBar}
              indicatorStyle={styles.tabIndicator}
              labelStyle={styles.tabLabel}
            />
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#d3e8d3',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moreIcon: {
    padding: 10,
  },
  refreshIcon: {
    padding: 10,
    marginRight: 10, // Add some space between the icons
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  currentFarmText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'left',
    marginBottom: 20,
  },
  moreIcon: {
    padding: 10,
  },
  optionsOverlay: {
    position: 'absolute',
    top: 110,
    right: 30,
    zIndex: 1, // Ensure options are above other content
    backgroundColor: '#fff',
    elevation: 4,
    borderRadius: 5,
  },
  optionsContainer: {
    flexDirection: 'column',
  },
  optionItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  optionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  parametersContainer: {
    flexDirection: 'column',
    paddingBottom: 90,
  },
  eventContainer: {
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  sectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#4caf50',
    borderRadius: 5,
    marginBottom: 10,
  },
  sectorHeaderText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  sectorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  tabBar: {
    backgroundColor: '#fff',
    color: '#000',
  },
  tabIndicator: {
    backgroundColor: '#000',
  },
  tabLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  addSectorButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
    backgroundColor: '#4CAF50',
    borderRadius: 5,
  },
  addSectorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  noEventsText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#888',
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  online: {
    color: 'blue',
  },
  offline: {
    color: 'red',
  },
});

export default DashboardScreen;
