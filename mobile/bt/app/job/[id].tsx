import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { jobsService, propertiesService, type Job, type Property } from '@/lib/firestore';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [propertyLoaded, setPropertyLoaded] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    if (id) {
      setLoading(true);
      
      // Realtime Listener für Job-Details
      unsubscribe = jobsService.subscribeToJobById(id, (jobData) => {
        if (jobData) {
          setJob(jobData);
          
          // Lade auch die Property-Details (nur einmal beim ersten Laden)
          if (jobData.propertyId && !propertyLoaded) {
            setPropertyLoaded(true);
            propertiesService.getById(jobData.propertyId).then(setProperty);
          }
        } else {
          setJob(null);
        }
        setLoading(false);
      });
    }

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
      }, [id]);

  const updateJobStatus = async (newStatus: Job['status']) => {
    if (!job?.id) return;
    
    try {
      setUpdating(true);
      await jobsService.update(job.id, { status: newStatus });
      // Der Realtime Listener wird automatisch die Änderung widerspiegeln
      Alert.alert('Erfolg', 'Status erfolgreich aktualisiert');
    } catch (error) {
      console.error('Error updating job status:', error);
      Alert.alert('Fehler', 'Fehler beim Aktualisieren des Status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'in-progress':
        return '#3b82f6';
      case 'completed':
        return '#10b981';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status: Job['status']) => {
    switch (status) {
      case 'pending':
        return 'Ausstehend';
      case 'in-progress':
        return 'In Bearbeitung';
      case 'completed':
        return 'Abgeschlossen';
      case 'cancelled':
        return 'Storniert';
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: Job['priority']) => {
    switch (priority) {
      case 'urgent':
        return '#ef4444';
      case 'high':
        return '#f97316';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getPriorityText = (priority: Job['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'Dringend';
      case 'high':
        return 'Hoch';
      case 'medium':
        return 'Mittel';
      case 'low':
        return 'Niedrig';
      default:
        return priority;
    }
  };

  const getCategoryText = (category: Job['category']) => {
    switch (category) {
      case 'maintenance':
        return 'Wartung';
      case 'repair':
        return 'Reparatur';
      case 'inspection':
        return 'Inspektion';
      case 'cleaning':
        return 'Reinigung';
      case 'other':
        return 'Sonstiges';
      default:
        return category;
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Kein Datum';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleStatusUpdate = (newStatus: Job['status']) => {
    const statusText = getStatusText(newStatus);
    Alert.alert(
      'Status ändern',
      `Möchten Sie den Status zu "${statusText}" ändern?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Ändern', onPress: () => updateJobStatus(newStatus) },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Lade Termin-Details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Termin nicht gefunden</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Zurück</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Zurück</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Termin Details</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Job Title and Status */}
        <View style={styles.section}>
          <Text style={styles.jobTitle}>{job.title}</Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(job.status) },
              ]}
            >
              <Text style={styles.statusText}>
                {getStatusText(job.status)}
              </Text>
            </View>
            <View
              style={[
                styles.priorityBadge,
                { backgroundColor: getPriorityColor(job.priority) },
              ]}
            >
              <Text style={styles.priorityText}>
                {getPriorityText(job.priority)}
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Beschreibung</Text>
          <Text style={styles.description}>{job.description}</Text>
        </View>

        {/* Property Information */}
        {property && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Objekt</Text>
            <View style={styles.propertyCard}>
              <Text style={styles.propertyName}>{property.name}</Text>
              <Text style={styles.propertyAddress}>{property.address}</Text>
              <Text style={styles.propertyType}>{property.type}</Text>
            </View>
          </View>
        )}

        {/* Job Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Kategorie</Text>
              <Text style={styles.detailValue}>{getCategoryText(job.category)}</Text>
            </View>
            {job.dueDate && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Fälligkeitsdatum</Text>
                <Text style={styles.detailValue}>{formatDate(job.dueDate)}</Text>
              </View>
            )}
            {job.estimatedHours && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Geschätzte Stunden</Text>
                <Text style={styles.detailValue}>{job.estimatedHours}h</Text>
              </View>
            )}
            {job.actualHours && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Tatsächliche Stunden</Text>
                <Text style={styles.detailValue}>{job.actualHours}h</Text>
              </View>
            )}
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Erstellt</Text>
              <Text style={styles.detailValue}>{formatDate(job.createdAt)}</Text>
            </View>
            {job.updatedAt && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Aktualisiert</Text>
                <Text style={styles.detailValue}>{formatDate(job.updatedAt)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Materials */}
        {job.materials && job.materials.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Materialien</Text>
            {job.materials.map((material, index) => (
              <Text key={index} style={styles.materialItem}>
                • {material}
              </Text>
            ))}
          </View>
        )}

        {/* Notes */}
        {job.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notizen</Text>
            <Text style={styles.notes}>{job.notes}</Text>
          </View>
        )}

        {/* Status Update Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status ändern</Text>
          <View style={styles.statusButtons}>
            {job.status !== 'pending' && (
              <TouchableOpacity
                style={[styles.statusButton, styles.pendingButton]}
                onPress={() => handleStatusUpdate('pending')}
                disabled={updating}
              >
                <Text style={styles.statusButtonText}>Ausstehend</Text>
              </TouchableOpacity>
            )}
            {job.status !== 'in-progress' && (
              <TouchableOpacity
                style={[styles.statusButton, styles.inProgressButton]}
                onPress={() => handleStatusUpdate('in-progress')}
                disabled={updating}
              >
                <Text style={styles.statusButtonText}>In Bearbeitung</Text>
              </TouchableOpacity>
            )}
            {job.status !== 'completed' && (
              <TouchableOpacity
                style={[styles.statusButton, styles.completedButton]}
                onPress={() => handleStatusUpdate('completed')}
                disabled={updating}
              >
                <Text style={styles.statusButtonText}>Abgeschlossen</Text>
              </TouchableOpacity>
            )}
            {job.status !== 'cancelled' && (
              <TouchableOpacity
                style={[styles.statusButton, styles.cancelledButton]}
                onPress={() => handleStatusUpdate('cancelled')}
                disabled={updating}
              >
                <Text style={styles.statusButtonText}>Storniert</Text>
              </TouchableOpacity>
            )}
          </View>
          {updating && (
            <View style={styles.updatingContainer}>
              <ActivityIndicator size="small" color="#3b82f6" />
              <Text style={styles.updatingText}>Aktualisiere Status...</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    marginBottom: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  jobTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
  },
  propertyCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
  },
  propertyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  propertyAddress: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  propertyType: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailsGrid: {
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
  },
  materialItem: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  notes: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  pendingButton: {
    backgroundColor: '#f59e0b',
  },
  inProgressButton: {
    backgroundColor: '#3b82f6',
  },
  completedButton: {
    backgroundColor: '#10b981',
  },
  cancelledButton: {
    backgroundColor: '#ef4444',
  },
  statusButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  updatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  updatingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6b7280',
  },
}); 