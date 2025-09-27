import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Modal, 
  ScrollView,
  SafeAreaView,
  Alert
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
    failed: 0
  });

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
    setModalEntries({ successful, accidents, failed });
    setShowModal(true);
  };

  const handleEmojiChange = (type, delta) => {
    setModalEntries(prev => ({
      ...prev,
      [type]: Math.max(0, prev[type] + delta)
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


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>💩 Pooping Control</Text>
        <Text style={styles.subtitle}>Track your daily pooping habits</Text>
        
        {/* Legend */}
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
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
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
});