import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';

export default function OmPage() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>⚽</Text>
          <Text style={styles.appName}>Fredagsliga</Text>
          <Text style={styles.version}>Versjon 2.0</Text>
        </View>

        {/* Om Fredagsliga FC */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fredagsliga FC</Text>
          <Text style={styles.text}>
            Futsal hver fredag! ⚽
          </Text>
          <Text style={styles.text}>
            Alle er velkomne - topptrente, mosjonister og de som engang var gode. 
            Kom som du er med godt humør, engasjement og en vilje til å ha det gøy!
          </Text>
          <View style={styles.highlightBox}>
            
            <Text style={styles.highlightSubtext}>
              Dette er kun for godt humør og samhold
            </Text>
          </View>
        </View>

        {/* Om Appen */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Om Appen</Text>
          <Text style={styles.text}>
            Fredagsliga-appen er laget for å gjøre futsal-kveldene våre enda bedre! 
            Hold styr på lag, kamper og statistikk - alt på ett sted.
          </Text>
          
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🏠</Text>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Velg lag</Text>
                <Text style={styles.featureDesc}>
                  Bestem hvilke lag som spiller i dag
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>⚽</Text>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Spill kamper</Text>
                <Text style={styles.featureDesc}>
                  Timer, scoring og automatisk rotasjon
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>📊</Text>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Følg med</Text>
                <Text style={styles.featureDesc}>
                  Statistikk og historikk over alle kamper
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>⏸️</Text>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Pause & Sudden Death</Text>
                <Text style={styles.featureDesc}>
                  Ta pauser når dere trenger, uavgjort løses på banen
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Utvikler */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Utvikler</Text>
          <Text style={styles.text}>
            Laget med ❤️ for alle fredagsliga-spillere
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerSubtext}>
            Zaurbek Zubayraev • 
          </Text>
          <Text style={styles.footerSubtext}>
            © 2025 for Fredagsliga FC
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  logo: {
    fontSize: 80,
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1d1d1f',
    marginBottom: 8,
    letterSpacing: -1,
  },
  version: {
    fontSize: 16,
    color: '#6e6e73',
    fontWeight: '500',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 16,
  },
  text: {
    fontSize: 17,
    lineHeight: 26,
    color: '#1d1d1f',
    marginBottom: 12,
  },
  highlightBox: {
    backgroundColor: '#34c759',
    borderRadius: 16,
    padding: 24,
    marginTop: 16,
    alignItems: 'center',
    shadowColor: '#34c759',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  highlightText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  highlightSubtext: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.95,
  },
  featureList: {
    marginTop: 16,
  },
  featureItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  featureTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 15,
    color: '#6e6e73',
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    borderTopWidth: 1,
    borderTopColor: '#e5e5ea',
    marginTop: 16,
  },
  footerText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 8,
  },
  footerSubtext: {
    fontSize: 14,
    color: '#6e6e73',
    fontWeight: '500',
    marginTop: 4,
  },
});