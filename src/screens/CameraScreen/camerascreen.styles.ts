import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  controlOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Slightly less transparent for better visibility
    justifyContent: 'space-between',
    padding: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 15,
    marginTop: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF', // Match HomeScreen text color
    textAlign: 'center',
    flex: 1,
  },
  backButton: {
    padding: 10,
  },
  controlPanel: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingBottom: 20,
  },
  actionButton: {
    width: '90%',
    backgroundColor: '#1F2937', // Match HomeScreen primary button
    borderRadius: 12,
    padding: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    alignItems: 'center',
    marginBottom: 15,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF', // Match HomeScreen button text
    marginBottom: 5,
    textAlign: 'center',
  },
  actionButtonSubtitle: {
    fontSize: 12,
    color: '#E5E7EB', // Match HomeScreen subtitle color
    textAlign: 'center',
  },
  controlButton: {
    width: '70%',
    backgroundColor: '#1F2937', // Slightly darker for contrast on camera feed
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    alignItems: 'center',
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  controlButtonText: {
    color: '#FFF',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937', // Match HomeScreen modal background
    borderRadius: 10,
    padding: 8,
    marginVertical: 10,
    alignSelf: 'center',
  },
  uploadingText: {
    color:  '#FFFFFF', // Match HomeScreen text color
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  responseContainer: {
    backgroundColor: '#1F2937', // Match HomeScreen modal background
    borderRadius: 10,
    padding: 12,
    marginVertical: 10,
    width: '90%',
    alignSelf: 'center',
    elevation: 4,
  },
  responseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF', // Match HomeScreen text color
    marginBottom: 5,
  },
  responseText: {
    fontSize: 14,
    color: '#FFFFFF', // Match HomeScreen text color
    marginBottom: 5,
  },
});