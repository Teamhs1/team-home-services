import { Page, Text, View, Document, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11 },
  title: { fontSize: 18, marginBottom: 20 },
  section: { marginBottom: 12 },
  label: { fontSize: 10, color: "#555" },
  value: { fontSize: 12, marginTop: 2 },
});

export default function InvoicePDF({ invoice }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Invoice</Text>

        <View style={styles.section}>
          <Text>Status: {invoice.status}</Text>
          <Text>Date: {new Date(invoice.created_at).toLocaleDateString()}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Property</Text>
          <Text style={styles.value}>{invoice.properties?.address || "—"}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Unit</Text>
          <Text style={styles.value}>{invoice.units?.unit || "—"}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Amount</Text>
          <Text style={styles.value}>
            ${(invoice.amount_cents / 100).toFixed(2)} CAD
          </Text>
        </View>

        {invoice.notes && (
          <View style={styles.section}>
            <Text style={styles.label}>Notes</Text>
            <Text style={styles.value}>{invoice.notes}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
