import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Modal, 
  ScrollView,
  SafeAreaView,
  Alert,
  Image
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Calendar } from 'react-native-calendars';

const STORAGE_KEY = 'pooping_entries';

export default function App() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [entries, setEntries] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalDate, setModalDate] = useState(null);
  const [modalEntries, setModalEntries] = useState({
    successful: 0,
    accidents: 0,
    failed: 0,
    type: null
  });
  const [showChartModal, setShowChartModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);

  // Load entries from AsyncStorage
  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const storedEntries = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedEntries) {
        const parsedEntries = JSON.parse(storedEntries);
        setEntries(parsedEntries);
        console.log('Loaded entries:', parsedEntries);
      } else {
        console.log('No stored entries found');
      }
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  };

  const saveEntries = async (newEntries) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
      setEntries(newEntries);
      console.log('Saved entries:', newEntries);
    } catch (error) {
      console.error('Error saving entries:', error);
    }
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const handleDatePress = (day) => {
    const dateStr = day.dateString;
    const dayEntries = entries[dateStr] || [];
    
    // Count existing entries
    let successful = 0;
    let accidents = 0;
    let failed = 0;
    
    dayEntries.forEach(entry => {
      if (entry.type === 'Accident') {
        accidents++;
      } else if (entry.type === 'Failed') {
        failed++;
      } else if (entry.type === 'Normal') {
        successful++;
      }
    });
    
    setModalDate(dateStr);
    setModalEntries({ successful, accidents, failed, type: null });
    setShowModal(true);
  };

  const handleEmojiChange = (type, delta) => {
    setModalEntries(prev => ({
      ...prev,
      [type]: Math.max(0, prev[type] + delta)
    }));
  };

  const handleTypeChange = (type) => {
    setModalEntries(prev => ({
      ...prev,
      type: prev.type === type ? null : type
    }));
  };

  const saveEmojiEntries = async () => {
    if (!modalDate) return;
    
    try {
      const newEntries = [];
      
      // Add successful poops
      for (let i = 0; i < modalEntries.successful; i++) {
        newEntries.push({
          id: Date.now() + i,
          date: modalDate,
          time: new Date().toTimeString().split(' ')[0],
          type: 'Normal',
          bristolType: modalEntries.type,
          notes: '',
          rating: 5
        });
      }
      
      // Add accidents
      for (let i = 0; i < modalEntries.accidents; i++) {
        newEntries.push({
          id: Date.now() + i + 1000,
          date: modalDate,
          time: new Date().toTimeString().split(' ')[0],
          type: 'Accident',
          bristolType: modalEntries.type,
          notes: '',
          rating: 1
        });
      }
      
      // Add failed attempts
      for (let i = 0; i < modalEntries.failed; i++) {
        newEntries.push({
          id: Date.now() + i + 2000,
          date: modalDate,
          time: new Date().toTimeString().split(' ')[0],
          type: 'Failed',
          bristolType: modalEntries.type,
          notes: '',
          rating: 1
        });
      }
      
      // Update entries
      const updatedEntries = { ...entries };
      updatedEntries[modalDate] = newEntries;
      await saveEntries(updatedEntries);
      
      setShowModal(false);
    } catch (error) {
      console.error('Error saving entries:', error);
      Alert.alert('Error', 'Failed to save entries');
    }
  };

  const getDateIndicators = (dateStr) => {
    const dayEntries = entries[dateStr] || [];
    
    let poopCount = 0;
    let accidentCount = 0;
    let failedCount = 0;
    
    dayEntries.forEach(entry => {
      if (entry.type === 'Accident') {
        accidentCount++;
      } else if (entry.type === 'Failed') {
        failedCount++;
      } else if (entry.type === 'Normal') {
        poopCount++;
      }
    });
    
    console.log(`Date ${dateStr}: poop=${poopCount}, accident=${accidentCount}, failed=${failedCount}`);
    return { poopCount, accidentCount, failedCount };
  };

  const getMarkedDates = () => {
    const markedDates = {};
    
    // Mark selected date
    markedDates[selectedDate] = { 
      selected: true, 
      selectedColor: '#667eea' 
    };
    
    // Mark dates with entries
    Object.keys(entries).forEach(dateStr => {
      const { poopCount, accidentCount, failedCount } = getDateIndicators(dateStr);
      const totalEntries = poopCount + accidentCount + failedCount;
      
      if (totalEntries > 0) {
        const dots = [];
        
        // Add dots for each type of entry
        for (let i = 0; i < poopCount; i++) {
          dots.push({ key: `poop-${i}`, color: '#48bb78' });
        }
        for (let i = 0; i < accidentCount; i++) {
          dots.push({ key: `accident-${i}`, color: '#8B4513' });
        }
        for (let i = 0; i < failedCount; i++) {
          dots.push({ key: `failed-${i}`, color: '#e53e3e' });
        }
        
        markedDates[dateStr] = {
          ...markedDates[dateStr],
          dots: dots,
          marked: true
        };
      }
    });
    
    return markedDates;
  };

  const getStatistics = () => {
    const allDates = Object.keys(entries);
    const loggedDays = allDates.length;
    
    if (loggedDays === 0) {
      return {
        totalDays: 0,
        successfulDays: 0,
        accidentDays: 0,
        failedDays: 0,
        totalSuccessful: 0,
        totalAccidents: 0,
        totalFailed: 0,
        successfulPercentage: 0,
        accidentPercentage: 0,
        failedPercentage: 0,
        avgSuccessfulPerDay: 0,
        avgAccidentsPerDay: 0,
        avgFailedPerDay: 0
      };
    }
    
    let successfulDays = 0;
    let accidentDays = 0;
    let failedDays = 0;
    let totalSuccessful = 0;
    let totalAccidents = 0;
    let totalFailed = 0;
    
    allDates.forEach(dateStr => {
      const { poopCount, accidentCount, failedCount } = getDateIndicators(dateStr);
      
      if (poopCount > 0) successfulDays++;
      if (accidentCount > 0) accidentDays++;
      if (failedCount > 0) failedDays++;
      
      totalSuccessful += poopCount;
      totalAccidents += accidentCount;
      totalFailed += failedCount;
    });
    
    return {
      totalDays: loggedDays,
      successfulDays,
      accidentDays,
      failedDays,
      totalSuccessful,
      totalAccidents,
      totalFailed,
      successfulPercentage: Math.round((successfulDays / loggedDays) * 100),
      accidentPercentage: Math.round((accidentDays / loggedDays) * 100),
      failedPercentage: Math.round((failedDays / loggedDays) * 100),
      avgSuccessfulPerDay: loggedDays > 0 ? (totalSuccessful / loggedDays).toFixed(1) : 0,
      avgAccidentsPerDay: loggedDays > 0 ? (totalAccidents / loggedDays).toFixed(1) : 0,
      avgFailedPerDay: loggedDays > 0 ? (totalFailed / loggedDays).toFixed(1) : 0
    };
  };


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>💩 Pooping Control</Text>
        <Text style={styles.subtitle}>Track your daily pooping habits</Text>
        
        {/* Legend and Stats Button */}
        <View style={styles.legendContainer}>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <Text style={styles.poopIndicator}>✓</Text>
              <Text style={styles.legendText}>Successful poops</Text>
            </View>
            <View style={styles.legendItem}>
              <Text style={styles.accidentIndicator}>💩</Text>
              <Text style={styles.legendText}>Accidents</Text>
            </View>
            <View style={styles.legendItem}>
              <Text style={styles.failedIndicator}>✗</Text>
              <Text style={styles.legendText}>Failed attempts</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.statsButton}
            onPress={() => setShowStatsModal(true)}
          >
            <Text style={styles.statsButtonText}>📊</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Calendar */}
      <View style={styles.calendarContainer}>
        <Calendar
          onDayPress={handleDatePress}
          markedDates={getMarkedDates()}
          theme={{
            backgroundColor: '#ffffff',
            calendarBackground: '#ffffff',
            textSectionTitleColor: '#4a5568',
            selectedDayBackgroundColor: '#667eea',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#667eea',
            dayTextColor: '#4a5568',
            textDisabledColor: '#d1d5db',
            dotColor: '#667eea',
            selectedDotColor: '#ffffff',
            arrowColor: '#667eea',
            monthTextColor: '#4a5568',
            indicatorColor: '#667eea',
            textDayFontWeight: '300',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '300',
            textDayFontSize: 16,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 13
          }}
          dayComponent={({ date, state }) => {
            const { poopCount, accidentCount, failedCount } = getDateIndicators(date.dateString);
            const hasEntries = poopCount > 0 || accidentCount > 0 || failedCount > 0;
            
            return (
              <TouchableOpacity 
                style={[
                  styles.calendarDay,
                  state === 'selected' && styles.selectedDay,
                  state === 'today' && styles.todayDay
                ]}
                onPress={() => handleDatePress(date)}
              >
                <Text style={[
                  styles.dayText,
                  state === 'selected' && styles.selectedDayText,
                  state === 'today' && styles.todayDayText
                ]}>
                  {date.day}
                </Text>
                {hasEntries && (
                  <View style={styles.emojiContainer}>
                    {poopCount > 0 && (
                      <Text style={styles.poopIndicator}>✓{poopCount > 1 ? poopCount : ''}</Text>
                    )}
                    {accidentCount > 0 && (
                      <Text style={styles.accidentIndicator}>💩{accidentCount > 1 ? accidentCount : ''}</Text>
                    )}
                    {failedCount > 0 && (
                      <Text style={styles.failedIndicator}>✗{failedCount > 1 ? failedCount : ''}</Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Modal */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Edit Entries for {modalDate}
              </Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.emojiEntry}>
                <View style={styles.emojiLabel}>
                  <Text style={styles.poopIndicator}>✓</Text>
                  <Text style={styles.emojiLabelText}>Successful poops</Text>
                </View>
                <View style={styles.emojiControls}>
                  <TouchableOpacity 
                    style={styles.controlButton}
                    onPress={() => handleEmojiChange('successful', -1)}
                  >
                    <Text style={styles.controlButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.count}>{modalEntries.successful}</Text>
                  <TouchableOpacity 
                    style={styles.controlButton}
                    onPress={() => handleEmojiChange('successful', 1)}
                  >
                    <Text style={styles.controlButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.emojiEntry}>
                <View style={styles.emojiLabel}>
                  <Text style={styles.accidentIndicator}>💩</Text>
                  <Text style={styles.emojiLabelText}>Accidents</Text>
                </View>
                <View style={styles.emojiControls}>
                  <TouchableOpacity 
                    style={styles.controlButton}
                    onPress={() => handleEmojiChange('accidents', -1)}
                  >
                    <Text style={styles.controlButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.count}>{modalEntries.accidents}</Text>
                  <TouchableOpacity 
                    style={styles.controlButton}
                    onPress={() => handleEmojiChange('accidents', 1)}
                  >
                    <Text style={styles.controlButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.emojiEntry}>
                <View style={styles.emojiLabel}>
                  <Text style={styles.failedIndicator}>✗</Text>
                  <Text style={styles.emojiLabelText}>Failed attempts</Text>
                </View>
                <View style={styles.emojiControls}>
                  <TouchableOpacity 
                    style={styles.controlButton}
                    onPress={() => handleEmojiChange('failed', -1)}
                  >
                    <Text style={styles.controlButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.count}>{modalEntries.failed}</Text>
                  <TouchableOpacity 
                    style={styles.controlButton}
                    onPress={() => handleEmojiChange('failed', 1)}
                  >
                    <Text style={styles.controlButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Bristol Stool Chart Type Selection */}
              <View style={styles.typeSelectionContainer}>
                <View style={styles.typeHeader}>
                  <Text style={styles.typeLabel}>Bristol Stool Type</Text>
                  <TouchableOpacity 
                    style={styles.infoButton}
                    onPress={() => setShowChartModal(true)}
                  >
                    <Text style={styles.infoButtonText}>ℹ️</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.typeButtons}>
                  {[1, 2, 3, 4, 5, 6, 7].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeButton,
                        modalEntries.type === type && styles.typeButtonSelected
                      ]}
                      onPress={() => handleTypeChange(type)}
                    >
                      <Text style={[
                        styles.typeButtonText,
                        modalEntries.type === type && styles.typeButtonTextSelected
                      ]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={saveEmojiEntries}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bristol Stool Chart Modal */}
      <Modal
        visible={showChartModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowChartModal(false)}
        statusBarTranslucent={true}
      >
        <TouchableOpacity 
          style={styles.chartModalOverlay}
          activeOpacity={1}
          onPress={() => setShowChartModal(false)}
        >
          <TouchableOpacity 
            style={styles.chartModalContent}
            activeOpacity={1}
            onPress={() => {}}
          >
            <View style={styles.chartModalHeader}>
              <Text style={styles.chartModalTitle}>Bristol Stool Chart</Text>
              <TouchableOpacity 
                style={styles.chartCloseButton}
                onPress={() => setShowChartModal(false)}
              >
                <Text style={styles.chartCloseButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.chartModalBody} showsVerticalScrollIndicator={false}>
              <Image
                source={{
                  uri: 'https://www.everydayhealth.com/images/stool-chart.png'
                }}
                style={styles.bristolChartImage}
                resizeMode="contain"
                onError={() => {
                  console.log('Image failed to load, showing fallback text');
                }}
              />
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Statistics Modal */}
      <Modal
        visible={showStatsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStatsModal(false)}
      >
        <View style={styles.statsModalOverlay}>
          <View style={styles.statsModalContent}>
            <View style={styles.statsModalHeader}>
              <Text style={styles.statsModalTitle}>📊 Statistics</Text>
              <TouchableOpacity 
                style={styles.statsCloseButton}
                onPress={() => setShowStatsModal(false)}
              >
                <Text style={styles.statsCloseButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.statsModalBody}>
              {(() => {
                const stats = getStatistics();
                if (stats.totalDays === 0) {
                  return (
                    <Text style={styles.noDataText}>No data logged yet. Start tracking your habits!</Text>
                  );
                }
                
                return (
                  <View style={styles.statisticsGrid}>
                    {/* Successful Poops */}
                    <View style={styles.statisticCard}>
                      <View style={styles.statisticHeader}>
                        <Text style={styles.poopIndicator}>✓</Text>
                        <Text style={styles.statisticLabel}>Successful</Text>
                      </View>
                      <Text style={styles.percentageText}>{stats.successfulPercentage}%</Text>
                      <Text style={styles.averageText}>Avg: {stats.avgSuccessfulPerDay}/day</Text>
                      <Text style={styles.totalText}>Total: {stats.totalSuccessful}</Text>
                    </View>

                    {/* Accidents */}
                    <View style={styles.statisticCard}>
                      <View style={styles.statisticHeader}>
                        <Text style={styles.accidentIndicator}>💩</Text>
                        <Text style={styles.statisticLabel}>Accidents</Text>
                      </View>
                      <Text style={styles.percentageText}>{stats.accidentPercentage}%</Text>
                      <Text style={styles.averageText}>Avg: {stats.avgAccidentsPerDay}/day</Text>
                      <Text style={styles.totalText}>Total: {stats.totalAccidents}</Text>
                    </View>

                    {/* Failed Attempts */}
                    <View style={styles.statisticCard}>
                      <View style={styles.statisticHeader}>
                        <Text style={styles.failedIndicator}>✗</Text>
                        <Text style={styles.statisticLabel}>Failed</Text>
                      </View>
                      <Text style={styles.percentageText}>{stats.failedPercentage}%</Text>
                      <Text style={styles.averageText}>Avg: {stats.avgFailedPerDay}/day</Text>
                      <Text style={styles.totalText}>Total: {stats.totalFailed}</Text>
                    </View>
                  </View>
                );
              })()}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4a5568',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    flex: 1,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#4a5568',
    marginLeft: 5,
  },
  calendarContainer: {
    flex: 1,
    padding: 10,
  },
  calendarDay: {
    height: 60,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
  },
  selectedDay: {
    backgroundColor: '#667eea',
    borderRadius: 8,
  },
  todayDay: {
    backgroundColor: '#e6f3ff',
    borderRadius: 8,
  },
  selectedDayText: {
    color: '#ffffff',
  },
  todayDayText: {
    color: '#667eea',
    fontWeight: 'bold',
  },
  dayText: {
    fontSize: 16,
    color: '#4a5568',
    marginBottom: 2,
  },
  emojiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  poopIndicator: {
    color: '#48bb78',
    fontWeight: 'bold',
    fontSize: 12,
    marginHorizontal: 1,
  },
  accidentIndicator: {
    fontSize: 12,
    marginHorizontal: 1,
  },
  failedIndicator: {
    color: '#e53e3e',
    fontWeight: 'bold',
    fontSize: 12,
    marginHorizontal: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a5568',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f7fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
  },
  modalBody: {
    padding: 20,
  },
  emojiEntry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f7fafc',
  },
  emojiLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emojiLabelText: {
    fontSize: 16,
    color: '#4a5568',
    marginLeft: 10,
  },
  emojiControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    backgroundColor: '#667eea',
    width: 35,
    height: 35,
    borderRadius: 17.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  controlButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  count: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a5568',
    minWidth: 30,
    textAlign: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  cancelButton: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#4a5568',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#48bb78',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  statsButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    marginLeft: 10,
  },
  statsButtonText: {
    fontSize: 20,
    color: '#ffffff',
  },
  statsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  statsModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  statsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  statsModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a5568',
  },
  statsCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f7fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsCloseButtonText: {
    fontSize: 20,
    color: '#666',
  },
  statsModalBody: {
    padding: 20,
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  statisticsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  statisticCard: {
    backgroundColor: '#f7fafc',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 2,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statisticHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statisticLabel: {
    fontSize: 10,
    color: '#4a5568',
    marginLeft: 3,
    fontWeight: '600',
  },
  percentageText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4a5568',
    marginBottom: 2,
  },
  averageText: {
    fontSize: 9,
    color: '#666',
    marginBottom: 1,
  },
  totalText: {
    fontSize: 9,
    color: '#666',
    fontWeight: '500',
  },
  typeSelectionContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  typeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a5568',
  },
  infoButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoButtonText: {
    fontSize: 16,
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  typeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f7fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeButtonSelected: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4a5568',
  },
  typeButtonTextSelected: {
    color: '#ffffff',
  },
  chartModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  chartModalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    width: '100%',
    maxHeight: '90%',
    maxWidth: '95%',
  },
  chartModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  chartModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a5568',
  },
  chartCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f7fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartCloseButtonText: {
    fontSize: 20,
    color: '#666',
  },
  chartModalBody: {
    padding: 10,
  },
  bristolChartImage: {
    width: '100%',
    height: 400,
    borderRadius: 10,
  },
});