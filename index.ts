interface Station {
  name: string;
  zones: number[];
}

interface Journey {
  from: string;
  to?: string;
  type: 'bus' | 'tube';
}

enum TransportType {
  BUS = 'bus',
  TUBE = 'tube',
}

const stations: Station[] = [
  { name: 'Holburn', zones: [1] },
  { name: 'Chelsea', zones: [1] },
  { name: "Earl's Court", zones: [1, 2] },
  { name: 'Wimbledon', zones: [3] },
  { name: 'Hammersmith', zones: [2] },
  { name: 'Southfields', zones: [3] },
  { name: 'Any Station', zones: [1] },
  { name: 'Another Station', zones: [1] },
  { name: 'Final Station', zones: [1] },
];


const fares = {
  bus: 1.80,
  max: 3.20,
  tube: {
    zone1Only: 2.50,
    oneZoneOutsideZone1: 2.00,
    twoZonesIncludingZone1: 3.00,
    twoZonesExcludingZone1: 2.25,
    threeZones: 3.20,
  },
};

class OysterCard {
  private balance: number;
  private currentJourney: Journey | null;

  constructor(initialBalance: number) {
    this.balance = initialBalance;
    this.currentJourney = null;
  }

  load(amount: number): void {
    this.balance += amount;
  }

  tapIn(stationName: string, type: TransportType): void {
    const station = stations.find(s => s.name === stationName);
    if (!station) throw new Error(`Station ${stationName} not found.`);

    if (type === TransportType.TUBE) {
      this.deductFare(fares.max);
      this.currentJourney = { from: stationName, type };
    } else if (type === TransportType.BUS) {
      this.deductFare(fares.bus);
    }
  }

  tapOut(stationName: string): void {
    if (!this.currentJourney || this.currentJourney.type !== TransportType.TUBE) {
      throw new Error('Invalid tap out.');
    }

    const departureStation = stations.find(s => s.name === this.currentJourney!.from);
    const arrivalStation = stations.find(s => s.name === stationName);
    if (!arrivalStation) throw new Error(`Station ${stationName} not found.`);

    const fare = this.calculateTubeFare(departureStation!, arrivalStation);
    this.adjustFare(fares.max - fare);
    this.currentJourney = null;
  }

  private deductFare(amount: number): void {
    if (this.balance < amount) throw new Error('Insufficient balance.');
    this.balance -= amount;
  }

  private adjustFare(refund: number): void {
    this.balance += refund;
  }

  private calculateTubeFare(from: Station, to: Station): number {
    // Get all possible combinations of zones for the journey
    const possibleFares: number[] = [];
    
    // For each possible starting zone
    for (const fromZone of from.zones) {
      // For each possible ending zone
      for (const toZone of to.zones) {
        const journeyZones = new Set([fromZone, toZone]);
        const journeySize = Math.abs(fromZone - toZone) + 1
        const isZone1Involved = journeyZones.has(1);
        
        // Calculate fare for this zone combination
        let fare: number;
        switch (journeySize) {
          case 1: // Same zone
            fare = isZone1Involved ? fares.tube.zone1Only : fares.tube.oneZoneOutsideZone1;
            break;
          case 2: // Different zones
            fare = isZone1Involved ? fares.tube.twoZonesIncludingZone1 : fares.tube.twoZonesExcludingZone1;
            break;
          default:
            fare = fares.tube.threeZones;
        }
        possibleFares.push(fare);
      }
    }
  
    // Return the lowest possible fare
    return Math.min(...possibleFares);
  }

  getBalance(): number {
    return this.balance;
  }
}
// TESTS
const card = new OysterCard(30);
console.log(`Initial Balance: £${card.getBalance().toFixed(2)}`);

// Tube Holburn to Earl’s Court
card.tapIn('Holburn', TransportType.TUBE);
card.tapOut("Earl's Court");
console.log(`Balance after Holburn to Earl"’"s Court: £${card.getBalance().toFixed(2)}`);

// Bus 328 from Earl's Court to Chelsea
card.tapIn("Earl's Court", TransportType.BUS);
console.log(`Balance after 328 bus to Chelsea: £${card.getBalance().toFixed(2)}`);

// Tube Chelsea to Wimbledon
card.tapIn('Chelsea', TransportType.TUBE);
card.tapOut('Wimbledon');
console.log(`Final Balance: £${card.getBalance().toFixed(2)}`);

// Test insufficient balance
const lowBalanceCard = new OysterCard(2);
console.log(`\nTesting insufficient balance scenarios:`);
console.log(`Initial Balance: £${lowBalanceCard.getBalance().toFixed(2)}`);

try {
  lowBalanceCard.tapIn('Holburn', TransportType.TUBE);
  console.log('Should have thrown insufficient balance error');
} catch (error) {
  console.log('Successfully prevented tap in with insufficient balance');
}

// Test incomplete journey
const incompleteJourneyCard = new OysterCard(30);
console.log(`\nTesting incomplete journey scenarios:`);
console.log(`Initial Balance: £${incompleteJourneyCard.getBalance().toFixed(2)}`);
incompleteJourneyCard.tapIn('Holburn', TransportType.TUBE);

try {
  incompleteJourneyCard.tapIn('Earl"s Court', TransportType.TUBE);
  console.log('Should have thrown error for not tapping out');
} catch (error) {
  console.log('Successfully prevented new journey without tapping out');
}

// Test maximum fare scenarios
const maxFareCard = new OysterCard(30);
console.log(`\nTesting maximum fare scenarios:`);
console.log(`Initial Balance: £${maxFareCard.getBalance().toFixed(2)}`);
maxFareCard.tapIn('Wimbledon', TransportType.TUBE);
maxFareCard.tapOut('Holburn');
console.log(`Balance after longest possible journey: £${maxFareCard.getBalance().toFixed(2)}`);

// Test same zone journey
const sameZoneCard = new OysterCard(30);
console.log(`\nTesting same zone journey:`);
console.log(`Initial Balance: £${sameZoneCard.getBalance().toFixed(2)}`);
sameZoneCard.tapIn('Wimbledon', TransportType.TUBE);
sameZoneCard.tapOut('Southfields');
console.log(`Balance after same zone journey: £${sameZoneCard.getBalance().toFixed(2)}`);

// Test multiple bus journeys
const busCard = new OysterCard(30);
console.log(`\nTesting multiple bus journeys:`);
console.log(`Initial Balance: £${busCard.getBalance().toFixed(2)}`);
busCard.tapIn('Any Station', TransportType.BUS);
busCard.tapIn('Another Station', TransportType.BUS);
busCard.tapIn('Final Station', TransportType.BUS);
console.log(`Balance after multiple bus journeys: £${busCard.getBalance().toFixed(2)}`);

