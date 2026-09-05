/**
 * Couche de persistance Djawdi.
 *
 * Les contrats conservés ici sont consommés par les procédures tRPC. Ils sont
 * désormais implémentés par Cloud Firestore via le SDK Admin Firebase ; le
 * navigateur n'accède jamais directement aux collections financières.
 */
export * from "./firebaseDb";
