import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/AuthContext';
import { jobsService, type Job } from '@/lib/firestore';
import { router } from 'expo-router';

export default function JobsScreen() {
  const { employee, login, logout } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (employee) {
      loadJobs();
    }
  }, [employee]);

  const loadJobs = async () => {
    if (!employee?.id) return;
    
    try {
      setLoading(true);
      const employeeJobs = await jobsService.getByAssignedTo(employee.id);
      setJobs(employeeJobs);
    } catch (error) {
      console.error('Error loading jobs:', error);
      Alert.alert('Fehler', 'Fehler beim Laden der Termine');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadJobs();
    setRefreshing(false);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Fehler', 'Bitte füllen Sie alle Felder aus.');
      return;
    }

    setIsLoggingIn(true);
    try {
      await login(email, password);
      // Login erfolgreich - Termine werden automatisch geladen
      setEmail('');
      setPassword('');
    } catch (error: any) {
      Alert.alert('Anmeldung fehlgeschlagen', error.message || 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Abmelden',
      'Möchten Sie sich wirklich abmelden?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Abmelden', onPress: logout },
      ]
    );
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

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Kein Datum';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const renderJobItem = ({ item }: { item: Job }) => (
    <TouchableOpacity
      style={styles.jobCard}
      onPress={() => router.push(`/job/${item.id}`)}
    >
      <View style={styles.jobHeader}>
        <Text style={styles.jobTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.jobDescription} numberOfLines={3}>
        {item.description}
      </Text>

      <View style={styles.jobDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Priorität:</Text>
          <View
            style={[
              styles.priorityBadge,
              { backgroundColor: getPriorityColor(item.priority) },
            ]}
          >
            <Text style={styles.priorityText}>
              {getPriorityText(item.priority)}
            </Text>
          </View>
        </View>

        {item.propertyName && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Objekt:</Text>
            <Text style={styles.detailValue}>{item.propertyName}</Text>
          </View>
        )}

        {item.dueDate && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Fällig:</Text>
            <Text style={styles.detailValue}>{formatDate(item.dueDate)}</Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Erstellt:</Text>
          <Text style={styles.detailValue}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Login Screen
  if (!employee) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.content}>
              {/* Logo/Branding */}
              <View style={styles.logoContainer}>
                <Image 
                  source={require('@/assets/images/icon.png')} 
                  style={styles.logoImage}
                  resizeMode="contain"
                />


              </View>

              {/* Login Form */}
              <View style={styles.formContainer}>
                <Text style={styles.title}>Mitarbeiter Login</Text>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>E-Mail</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="ihre.email@beispiel.de"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoggingIn}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Passwort</Text>
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Ihr Passwort"
                    secureTextEntry
                    editable={!isLoggingIn}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.loginButton, isLoggingIn && styles.loginButtonDisabled]}
                  onPress={handleLogin}
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.loginButtonText}>Anmelden</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Kontaktieren Sie Ihren Administrator für Zugangsdaten
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Jobs Screen (nach erfolgreicher Anmeldung)
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Willkommen,</Text>
          <Text style={styles.employeeName}>{employee.name}</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.profileButton} 
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Text style={styles.profileButtonText}>Profil</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Abmelden</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Meine Termine</Text>
          <Text style={styles.jobCount}>{jobs.length} Termine</Text>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Lade Termine...</Text>
          </View>
        ) : jobs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Keine Termine</Text>
            <Text style={styles.emptyText}>
              Sie haben derzeit keine zugewiesenen Termine.
            </Text>
          </View>
        ) : (
          <FlatList
            data={jobs}
            renderItem={renderJobItem}
            keyExtractor={(item) => item.id!}
            contentContainerStyle={styles.jobList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 24,
    flex: 1,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: -20,
  },
  logoImage: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  loginButton: {
    backgroundColor: '#288FAF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
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
  welcomeText: {
    fontSize: 14,
    color: '#6b7280',
  },
  employeeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 10,
  },
  profileButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  jobCount: {
    fontSize: 14,
    color: '#6b7280',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  jobList: {
    paddingBottom: 16,
  },
  jobCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
    marginRight: 12,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  jobDescription: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  jobDetails: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
