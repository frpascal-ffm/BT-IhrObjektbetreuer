import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { Text, Button, Portal, Modal } from 'react-native-paper';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, isToday } from 'date-fns';
import { de } from 'date-fns/locale';
import { useAuth } from '../lib/AuthContext';
import { appointmentsService, type Appointment } from '../lib/firestore';

const TermineScreen: React.FC = () => {
  const { employee } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      if (employee?.firebaseUid) {
        const data = await appointmentsService.getByAssignedTo(employee.firebaseUid);
        setAppointments(data);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
      Alert.alert('Fehler', 'Termine konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  const handleAppointmentAction = async (appointment: Appointment, action: 'completed' | 'cancelled') => {
    try {
      if (!appointment.id) return;

      await appointmentsService.update(appointment.id, { status: action });
      
      // Update local state
      setAppointments(prev => prev.map(a => 
        a.id === appointment.id 
          ? { ...a, status: action }
          : a
      ));
      
      setDetailModalVisible(false);
      
      Alert.alert(
        'Erfolg', 
        action === 'completed' ? 'Termin als abgeschlossen markiert' : 'Termin als abgesagt markiert'
      );
    } catch (error) {
      console.error('Error updating appointment:', error);
      Alert.alert('Fehler', 'Termin konnte nicht aktualisiert werden');
    }
  };

  const getWeekDays = () => {
    const start = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  };

  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter(appointment => {
      if (!appointment.startTime) return false;
      
      const appointmentDate = appointment.startTime.toDate ? 
        appointment.startTime.toDate() : 
        new Date(appointment.startTime);
      
      return isSameDay(appointmentDate, date) && appointment.status === 'scheduled';
    });
  };

  const navigateWeek = (direction: 'next' | 'prev') => {
    setCurrentWeek(direction === 'next' ? addWeeks(currentWeek, 1) : subWeeks(currentWeek, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentWeek(today);
    setSelectedDate(today);
  };

  const selectDate = (date: Date) => {
    setSelectedDate(date);
  };

  const openAppointmentDetail = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDetailModalVisible(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'cancelled': return '#F44336';
      case 'scheduled': return '#2196F3';
      case 'in-progress': return '#FF9800';
      default: return '#757575';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Abgeschlossen';
      case 'cancelled': return 'Abgesagt';
      case 'scheduled': return 'Geplant';
      case 'in-progress': return 'In Bearbeitung';
      default: return status;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Lade Termine...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.todayButton} onPress={goToToday}>
            <Text style={styles.todayButtonText}>🕐 Today</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.calendarButton}>
            <Text style={styles.calendarButtonText}>📅</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.headerCenter}>
          <Text style={styles.currentDayText}>
            {format(selectedDate, 'EEEE', { locale: de })}
          </Text>
          <Text style={styles.currentDateText}>
            {format(selectedDate, 'MMMM d, yyyy', { locale: de })}
          </Text>
        </View>
        
        <TouchableOpacity style={styles.profileButton}>
          <Text style={styles.profileButtonText}>👤</Text>
        </TouchableOpacity>
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarSection}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={() => navigateWeek('prev')} style={styles.navArrow}>
            <Text style={styles.arrowText}>‹</Text>
          </TouchableOpacity>
          
          <View style={styles.daysHeader}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <Text key={index} style={styles.dayLabel}>{day}</Text>
            ))}
          </View>
          
          <TouchableOpacity onPress={() => navigateWeek('next')} style={styles.navArrow}>
            <Text style={styles.arrowText}>›</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.datesRow}>
          {getWeekDays().map((date, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dateCell,
                isToday(date) && styles.todayCell,
                isSameDay(date, selectedDate) && styles.selectedCell
              ]}
              onPress={() => selectDate(date)}
            >
              <Text style={[
                styles.dateText,
                isToday(date) && styles.todayText,
                isSameDay(date, selectedDate) && styles.selectedText
              ]}>
                {format(date, 'd')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Appointments List */}
      <ScrollView style={styles.termineContainer}>
        <Text style={styles.sectionTitle}>
          Termine für {format(selectedDate, 'dd.MM.yyyy', { locale: de })}
        </Text>
        
        {getAppointmentsForDay(selectedDate).map((appointment) => {
          const startTime = appointment.startTime.toDate ? 
            appointment.startTime.toDate() : 
            new Date(appointment.startTime);
          const endTime = appointment.endTime.toDate ? 
            appointment.endTime.toDate() : 
            new Date(appointment.endTime);
          
          return (
            <TouchableOpacity
              key={appointment.id}
              style={styles.terminCard}
              onPress={() => openAppointmentDetail(appointment)}
            >
              <Text style={styles.terminTime}>
                {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
              </Text>
              <Text style={styles.terminTitle}>
                {appointment.title}
              </Text>
              <View style={styles.locationContainer}>
                <Text style={styles.locationText}>
                  📍 {appointment.location}
                </Text>
              </View>
              {appointment.description && (
                <Text style={styles.descriptionText} numberOfLines={2}>
                  {appointment.description}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
        
        {getAppointmentsForDay(selectedDate).length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Keine Termine für diesen Tag</Text>
          </View>
        )}
      </ScrollView>

      {/* Appointment Detail Modal */}
      <Portal>
        <Modal
          visible={detailModalVisible}
          onDismiss={() => setDetailModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          {selectedAppointment && (
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Termin Details</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Titel:</Text>
                <Text style={styles.detailValue}>{selectedAppointment.title}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Zeit:</Text>
                <Text style={styles.detailValue}>
                  {selectedAppointment.startTime && selectedAppointment.endTime ? 
                    `${format(
                      selectedAppointment.startTime.toDate ? 
                        selectedAppointment.startTime.toDate() : 
                        new Date(selectedAppointment.startTime), 
                      'dd.MM.yyyy HH:mm'
                    )} - ${format(
                      selectedAppointment.endTime.toDate ? 
                        selectedAppointment.endTime.toDate() : 
                        new Date(selectedAppointment.endTime), 
                      'HH:mm'
                    )}` : 'Nicht angegeben'
                  }
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Ort:</Text>
                <Text style={styles.detailValue}>{selectedAppointment.location}</Text>
              </View>
              
              {selectedAppointment.description && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Beschreibung:</Text>
                  <Text style={styles.detailValue}>{selectedAppointment.description}</Text>
                </View>
              )}
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <Text style={[styles.detailValue, { color: getStatusColor(selectedAppointment.status) }]}>
                  {getStatusText(selectedAppointment.status)}
                </Text>
              </View>
              
              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={() => setDetailModalVisible(false)}
                  style={styles.modalButton}
                >
                  Schließen
                </Button>
                
                {selectedAppointment.status === 'scheduled' && (
                  <>
                    <Button
                      mode="contained"
                      onPress={() => handleAppointmentAction(selectedAppointment, 'completed')}
                      style={[styles.modalButton, { backgroundColor: '#4CAF50' }]}
                    >
                      Als abgeschlossen markieren
                    </Button>
                    
                    <Button
                      mode="contained"
                      onPress={() => handleAppointmentAction(selectedAppointment, 'cancelled')}
                      style={[styles.modalButton, { backgroundColor: '#F44336' }]}
                    >
                      Als abgesagt markieren
                    </Button>
                  </>
                )}
              </View>
            </View>
          )}
        </Modal>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  todayButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 10,
  },
  todayButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  calendarButton: {
    padding: 8,
  },
  calendarButtonText: {
    fontSize: 20,
  },
  headerCenter: {
    alignItems: 'center',
  },
  currentDayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  currentDateText: {
    fontSize: 14,
    color: '#666',
  },
  profileButton: {
    padding: 8,
  },
  profileButtonText: {
    fontSize: 20,
  },
  calendarSection: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  navArrow: {
    padding: 10,
  },
  arrowText: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  daysHeader: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 30,
    textAlign: 'center',
  },
  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  dateCell: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCell: {
    backgroundColor: '#007AFF',
  },
  selectedCell: {
    backgroundColor: '#e3f2fd',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  todayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  selectedText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  termineContainer: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  terminCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  terminTime: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 5,
  },
  terminTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  locationContainer: {
    marginBottom: 5,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
  },
  modalContainer: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    padding: 20,
  },
  modalContent: {
    gap: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  modalActions: {
    marginTop: 20,
    gap: 10,
  },
  modalButton: {
    marginVertical: 5,
  },
});

export default TermineScreen; 