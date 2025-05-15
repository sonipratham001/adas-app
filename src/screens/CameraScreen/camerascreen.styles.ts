import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  controlOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'space-between',
    padding: 20,
    zIndex: 10, // Ensure overlay is above Camera component
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 40,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
    left: 14,
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    padding: 15, // Increased padding for larger touch area
    zIndex: 20, // Ensure button is above other elements
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 30,
  },
  actionButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButton: {
    padding: 10,
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    borderRadius: 12,
    padding: 10,
    marginVertical: 15,
    alignSelf: 'center',
  },
  uploadingText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  responseContainer: {
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    borderRadius: 12,
    padding: 15,
    marginVertical: 15,
    width: '90%',
    alignSelf: 'center',
    maxHeight: 200,
  },
  responseTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
  },
  responseText: {
    fontSize: 14,
    color: '#D1D5DB',
    marginBottom: 5,
  },
});