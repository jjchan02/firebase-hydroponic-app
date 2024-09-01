import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  TextInput,
  Switch,
} from 'react-native';
import {css} from '@emotion/native';
import Header from '../components/Header';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Picker} from '@react-native-picker/picker';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import axios from 'axios';
import {getStoredSectorList} from '../utils/LocalSectorList';
import {API_URL} from '@env';

const containerStyle = css`
  flex: 1;
  padding: 20px;
  background-color: #d3e8d3;
`;

const headerStyle = css`
  font-size: 25px;
  font-weight: bold;
  margin-bottom: 20px;
`;

const parameterStyle = css`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  margin-bottom: 15px;
  background-color: #fff;
  border-radius: 5px;
`;

const parameterItem = css`
  padding: 20px;
  margin-bottom: 15px;
  background-color: #fff;
  border-radius: 5px;
`;

const parameterItemValue = css`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const editButtonStyle = css`
  background-color: #fff;
  padding: 5px 10px;
  border-radius: 5px;
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

const modalButton = css`
  padding: 10px 30px;
  background-color: white;
  border-radius: 5px;
  align-items: center;
  margin-top: 10px;
  margin-horizontal: 5px;
`;

const textStyle = css`
  font-size: 16px;
  font-weight: bold;
  color: black;
  margin-bottom: 5px;
`;

const triggerTitleStyle = css`
  font-size: 18px;
  font-weight: bold;
  color: black;
  margin-bottom: 10px;
`;

const sectorTitleStyle = css`
  font-size: 22px;
  font-weight: bold;
  color: white;
`;

const parameterNameMap = {
  surroundingTemperature: 'Surrounding Temperature (°C)',
  surroundingHumidity: 'Surrounding Humidity (%)',
  solutionTemperature: 'Solution Temperature (°C)',
  lightIntensity: 'Light Intensity (lx)',
  tds: 'TDS (ppm)',
  pH: 'pH',
  foggerTemperature: 'Fogger Temperature',
  foggerHumidity: 'Fogger Humidity',
};

const triggerNameMap = {
  lowTdsTrigger: 'Low TDS Trigger',
  highTdsTrigger: 'High TDS Trigger',
  lowPhTrigger: 'Low pH Trigger',
  highPhTrigger: 'High pH Trigger',
  foggerTrigger: 'Fogger Trigger',
};

const ControlScreen = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [pickerModalVisible, setPickerModalVisible] = useState(false);
  const [selectedParameter, setSelectedParameter] = useState(null);
  const [parameterValue, setParameterValue] = useState('');
  const [parameters, setParameters] = useState({});
  const [visibility, setVisibility] = useState({});
  const navigation = useNavigation();

  const fetchParameters = async () => {
    try {
      const sectorList = await getStoredSectorList();
      if (sectorList && sectorList.length > 0) {
        const fetchedParameters = await Promise.all(
          sectorList.map(async sectorId => {
            try {
              const response = await axios.get(
                `${API_URL}/sector/getParameterSettings/${sectorId}`,
              );
              const parameterSettings = response.data.parameterSettings;

              const triggerResponse = await axios.get(
                `${API_URL}/sector/getTriggerSettings/${sectorId}`,
              );
              const triggerSettings = triggerResponse.data.triggerSettings;

              const formattedParameters = Object.keys(parameterSettings).map(
                key => ({
                  name: key,
                  displayName: parameterNameMap[key] || key,
                  value: parameterSettings[key].join(' - '),
                }),
              );

              return {
                sectorId,
                parameters: formattedParameters,
                triggerSettings,
              };
            } catch (error) {
              console.error(
                `Error fetching data for sector ${sectorId}:`,
                error,
              );
              Alert.alert(
                'Error',
                `Failed to fetch data for sector ${sectorId}.`,
              );
              return {
                sectorId,
                parameters: [],
                triggerSettings: {},
              };
            }
          }),
        );

        const parametersBySector = fetchedParameters.reduce(
          (acc, {sectorId, parameters, triggerSettings}) => {
            acc[sectorId] = {parameters, triggerSettings};
            return acc;
          },
          {},
        );

        const initialVisibility = sectorList.reduce((acc, sectorId) => {
          acc[sectorId] = true;
          return acc;
        }, {});

        setParameters(parametersBySector);
        setVisibility(initialVisibility);
      }
    } catch (error) {
      console.error('Error fetching parameters:', error);
      Alert.alert('Error', 'Failed to fetch parameters.');
    }
  };

  useEffect(() => {
    fetchParameters();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchParameters();
    }, []),
  );

  const openModal = (parameter, sectorId) => {
    setSelectedParameter({...parameter, sectorId});
    setParameterValue(parameter.value);
    if (parameter.name === 'Status') {
      setPickerModalVisible(true);
    } else {
      setModalVisible(true);
    }
  };

  const closeModal = async () => {
    if (selectedParameter) {
      const {name, sectorId} = selectedParameter;
      const updatedParameters = parameters[sectorId].parameters.map(param =>
        param.name === name ? {...param, value: parameterValue} : param,
      );

      setParameters(prevState => ({
        ...prevState,
        [sectorId]: {...prevState[sectorId], parameters: updatedParameters},
      }));

      try {
        // Fetch the current settings from the server
        const response = await axios.get(
          `${API_URL}/sector/getParameterSettings/${sectorId}`,
        );
        const existingSettings = response.data.parameterSettings || {};

        // Create the new updated settings
        const updatedSetting = {
          [name]: parameterValue.split(' - ').map(Number),
        };

        // Merge the existing settings with the updated setting
        const newSettings = {...existingSettings, ...updatedSetting};

        // Send the merged settings to the server
        await axios.post(`${API_URL}/sector/updateParameterSettings`, {
          sectorId,
          parameterSettings: newSettings,
        });
      } catch (error) {
        console.error('Error updating parameter settings:', error);
        Alert.alert('Error', 'Failed to update parameter settings.');
      }
    }

    setSelectedParameter(null);
    setModalVisible(false);
    setPickerModalVisible(false);
  };

  const renderTriggerSwitch = (trigger, sectorId) => (
    <View key={trigger.name} style={parameterItem}>
      <View style={parameterItemValue}>
        <Text style={triggerTitleStyle}>
          {triggerNameMap[trigger.name] || trigger.name}
        </Text>
        <Switch
          value={trigger.value === true}
          onValueChange={value =>
            handleSwitchChange(trigger.name, sectorId, value)
          }
        />
      </View>
    </View>
  );

  const handleSwitchChange = async (triggerName, sectorId, isOn) => {
    const newTriggerSettings = {
      ...parameters[sectorId].triggerSettings,
      [triggerName]: isOn ? true : false,
    };

    try {
      await axios.post(`${API_URL}/sector/updateTriggerSettings`, {
        sectorId,
        triggerSettings: newTriggerSettings,
      });

      setParameters(prevState => ({
        ...prevState,
        [sectorId]: {
          ...prevState[sectorId],
          triggerSettings: newTriggerSettings,
        },
      }));
    } catch (error) {
      console.error('Error updating trigger settings:', error);
      Alert.alert('Error', 'Failed to update trigger settings.');
    }
  };

  const toggleVisibility = sectorId => {
    setVisibility(prevState => ({
      ...prevState,
      [sectorId]: !prevState[sectorId],
    }));
  };

  return (
    <ScrollView
      style={containerStyle}
      contentContainerStyle={{paddingBottom: 100}}>
      <Header navigation={navigation} />
      <Text style={headerStyle}>Control Panel</Text>
      {Object.keys(parameters).map((sectorId, index) => (
        <View key={sectorId}>
          <TouchableOpacity
            style={{...parameterStyle, backgroundColor: '#4caf50'}}
            onPress={() => toggleVisibility(sectorId)}>
            <Text style={sectorTitleStyle}>Sector {index + 1}</Text>
            <Icon
              name={visibility[sectorId] ? 'expand-less' : 'expand-more'}
              size={24}
              color="white"
            />
          </TouchableOpacity>
          {visibility[sectorId] && (
            <>
              {parameters[sectorId].parameters.map(parameter => (
                <View key={parameter.name} style={parameterItem}>
                  <View style={parameterItemValue}>
                    <Text style={textStyle}>{parameter.displayName}</Text>
                    <TouchableOpacity
                      style={editButtonStyle}
                      onPress={() => openModal(parameter, sectorId)}>
                      <Icon name="edit" size={23} />
                    </TouchableOpacity>
                  </View>
                  <Text style={textStyle}>{parameter.value}</Text>
                </View>
              ))}
              <Text style={triggerTitleStyle}>Trigger Action</Text>
              {Object.keys(parameters[sectorId].triggerSettings).map(
                triggerName =>
                  renderTriggerSwitch(
                    {
                      name: triggerName,
                      displayName: triggerNameMap[triggerName] || triggerName,
                      value: parameters[sectorId].triggerSettings[triggerName],
                    },
                    sectorId,
                  ),
              )}
            </>
          )}
        </View>
      ))}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={modalContentStyle}>
          <View style={modalInnerContentStyle}>
            <Text style={textStyle}>Edit {selectedParameter?.displayName}</Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 10,
              }}>
              <Text style={{marginRight: 10, color: 'black'}}>
                Lower Boundary:
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#ccc',
                  padding: 5,
                  width: '30%',
                  textAlign: 'center',
                }}
                value={parameterValue.split(' - ')[0]}
                keyboardType="numeric"
                onChangeText={text => {
                  let valueParts = parameterValue.split(' - ');
                  valueParts[0] = text;
                  setParameterValue(valueParts.join(' - '));
                }}
              />
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 10,
              }}>
              <Text style={{marginRight: 10, color: 'black'}}>
                Upper Boundary:
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#ccc',
                  padding: 5,
                  width: '30%',
                  textAlign: 'center',
                }}
                value={parameterValue.split(' - ')[1]}
                keyboardType="numeric"
                onChangeText={text => {
                  let valueParts = parameterValue.split(' - ');
                  valueParts[1] = text;
                  setParameterValue(valueParts.join(' - '));
                }}
              />
            </View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: 20,
              }}>
              <TouchableOpacity style={modalButton} onPress={closeModal}>
                <Text
                  style={{color: 'green', fontSize: 16, fontWeight: 'bold'}}>
                  Save
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={modalButton}
                onPress={() => setModalVisible(false)}>
                <Text style={{color: 'red', fontSize: 16, fontWeight: 'bold'}}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={pickerModalVisible}
        transparent={true}
        animationType="slide">
        <View style={modalContentStyle}>
          <View style={modalInnerContentStyle}>
            <Text style={textStyle}>Edit {selectedParameter?.displayName}</Text>
            <Picker
              selectedValue={parameterValue}
              style={{width: '100%'}}
              onValueChange={itemValue => setParameterValue(itemValue)}>
              <Picker.Item label="On" value="On" />
              <Picker.Item label="Off" value="Off" />
            </Picker>
            <TouchableOpacity style={modalButton} onPress={closeModal}>
              <Text style={{color: 'green', fontSize: 16, fontWeight: 'bold'}}>
                Save
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={modalButton}
              onPress={() => setPickerModalVisible(false)}>
              <Text style={{color: 'red', fontSize: 16, fontWeight: 'bold'}}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default ControlScreen;
