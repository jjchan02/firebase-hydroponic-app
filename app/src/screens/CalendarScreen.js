import React from 'react';
import {View, Text, FlatList, TouchableOpacity} from 'react-native';
import {Calendar} from 'react-native-calendars';
import BackButton from '../components/BackButton';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {css} from '@emotion/native';

const CalendarScreen = ({route, navigation}) => {
  const {event, events} = route.params;

  const markedDates = {};
  events.forEach(ev => {
    markedDates[ev.date] = {
      selected: true,
      marked: true,
      selectedColor: 'green',
    };
  });

  const renderCustomHeader = date => {
    const headerDate = date.toString('MMMM yyyy');
    return (
      <View style={headerContainer}>
        <Text style={headerText}>{headerDate}</Text>
      </View>
    );
  };

  const listContentContainerStyle = css`
    padding-bottom: 80px;
  `;

  const eventItemStyle = css`
    padding: 10px 0;
    border-bottom-width: 1px;
    border-bottom-color: #ccc;
  `;

  const container = css`
    flex: 1;
    padding: 20px;
    background-color: #d3e8d3;
  `;

  const header = css`
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 20px;
    margin-top: 10px;
  `;

  const headerContainer = css`
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding-horizontal: 10px;
    padding-vertical: 5px;
  `;

  const headerText = css`
    font-size: 18px;
    font-weight: bold;
  `;

  const eventTitle = css`
    font-size: 18px;
    font-weight: bold;
    margin-top: 20px;
  `;

  const eventDate = css`
    font-size: 16px;
    color: green;
    font-weight: bold;
  `;

  const eventDesc = css`
    font-size: 16px;
    color: gray;
  `;

  return (
    <View style={container}>
      <BackButton onPress={() => navigation.goBack()} />
      <Text style={header}>Event Calendar</Text>
      <Calendar
        current={event.date}
        minDate={'2020-01-01'}
        maxDate={'2030-12-31'}
        onDayPress={day => {
          console.log('selected day', day);
        }}
        monthFormat={'yyyy MM'}
        onMonthChange={month => {
          console.log('month changed', month);
        }}
        hideArrows={true}
        renderArrow={direction => {
          const iconName =
            direction === 'left' ? 'arrow-back' : 'arrow-forward';
          return <Icon name={iconName} size={20} color="#000000" />;
        }}
        hideExtraDays={false}
        disableMonthChange={true}
        firstDay={1}
        showWeekNumbers={false}
        onPressArrowLeft={subtractMonth => subtractMonth()}
        onPressArrowRight={addMonth => addMonth()}
        disableArrowLeft={false}
        disableArrowRight={false}
        disableAllTouchEventsForDisabledDays={true}
        renderHeader={renderCustomHeader}
        enableSwipeMonths={false}
        markedDates={markedDates}
      />
      <FlatList
        data={events}
        keyExtractor={item => item.id}
        contentContainerStyle={listContentContainerStyle}
        renderItem={({item}) => (
          <TouchableOpacity style={eventItemStyle}>
            <Text style={eventTitle}>{item.title}</Text>
            <Text style={eventDesc}>{item.description}</Text>
            <Text style={eventDate}>{item.date}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default CalendarScreen;
