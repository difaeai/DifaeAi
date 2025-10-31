
"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, Milestone } from "lucide-react";

const policeStations = [
  {
    name: "Aabpara",
    contact: "051-9204830",
    location: "Aabpara (Melody/ Near Poly Clinic Hospital)",
    email: "sho.aabpara@islamabadpolice.gov.pk",
    boundaries: "G/6, G/7 & SHAKAR PARRYAN, Sports Complex, Hele Pad.",
  },
  {
    name: "Bani Gala",
    contact: "051-9255339",
    location: "Park Road Shehzad Town",
    email: "sho.banigala@islamabadpolice.gov.pk",
    boundaries: "Bani Gala, Mohra Noor, Malot, Lakhwal, Kuri, Jagyot, Nogri, Morya, Pir Sahaba Chock, Seevra, Pind Bhigwal, Bahria Enclave, Park View City, NIH, Rtahra, Dokh Iblagh, Chapran.",
  },
  {
    name: "Barakahu",
    contact: "051-2230029",
    location: "Simli Road",
    email: "sho.Bharakaho@islamabadpolice.gov.pk",
    boundaries: "Athaal, Bobrdi, Phalgran, Jang bangyal, Chater, Sakrila, Sban Syedan, Shahdra, bhara Kahu, Mandla, Mangial, Sangalian, Mera Bigwal, Dokh Jillani.",
  },
  {
    name: "CTD",
    contact: "051-2303939",
    location: "Islamabad",
    email: "ctd@islamabadpolice.gov.pk",
    boundaries: "All Station Boundaries.",
  },
  {
    name: "Golra Sharif",
    contact: "051-9267099",
    location: "Golra Sharif Village",
    email: "sho.golra@islamabadpolice.gov.pk",
    boundaries: "D-12, G-13/14/15-3/4, Ghulsan Khudadat Society Sector, Gora Sharif, Asri Saral, Shah Allah Ditta, Darek Mohri, Mir Jafer, Mirako, Johad Village, Beakrako, Beaker Jateh Bakhs, Sadaat Colony, Pind Paracha, Dokh Soyan, Golra Darbar, Golra Railway Station PoliceStation Golra, Area of G-12 i.e. Mera Abadi, Mera jaffar, mera aka.",
  },
  {
    name: "Humak",
    contact: "N/A",
    location: "Police Station Humak, T-chowk, Sector H DHA Phase II, Islamabad, Islamabad Capital Territory",
    email: "sho.humak@islamabadpolice.gov.pk",
    boundaries: "Niazian, Kakpull, Mohra Kalu/ Mohra Nakyal, Sawan Camp, Zaraj Housing Society, DHA-2, Dhok Awan/ Model G.T Road, DHA-5 / DHA Valley/ Shaikhpur/ Nara Syedan.",
  },
  {
    name: "Industrial Area I-9",
    contact: "051-9258877",
    location: "Industrial Area I-9",
    email: "sho.industrailarea@islamabadpolice.gov.pk",
    boundaries: "I-9, I-8, H-8, H-9, Faizabad, IJP road Near Faizabad.",
  },
  {
    name: "Karachi Company",
    contact: "051-9334091",
    location: "G-9 Markaz",
    email: "sho.kcompany@islamabadpolice.gov.pk",
    boundaries: "G-8, G-9.",
  },
  {
    name: "Khanna",
    contact: "051-4473600",
    location: "Khann Pul Main Express way",
    email: "sho.khanna@islamabadpolice.gov.pk",
    boundaries: "Khanna Pul, Faizabad, Barma Town, Madina Town, Sanam Chock, Jba Town Margalla Town, new Shakrial, Nawaz Town, Nawaz Akber Town, Sultan Town, Pandorian , Sohan, Pandorian, Zia Masjid, Iqbal Town, Chasma Town, Nizamudin Town, Shakrial, Lehtrar Road, Dokh Kala Khan (Including Express Way), Margalla Town, Ojri Khurd, Pona Fagiran.",
  },
  {
    name: "Kirpa",
    contact: "N/A",
    location: "N/A",
    email: "sho.kirpa@islamabadpolice.gov.pk",
    boundaries: "Kirpa,DarxvalaDarwala,GulberugResidencia,Bangial,Sigga,PindoriSyedian.BaghJogian,Chalimoso Khan, Gliora Mast, Baian Syedan, DhokP1am, Dhok Mandi, Bhimbhar Tarar, Ladhiot Syedian,Pind Malkan, Jhan Syedan, Ali Pur Farasla, Chontra,Eden Life, Japan Road Dam, Arslan Town, TliandaPani,MeliboobChowk Jinnah Garden, Capital Enclave, NavalAnchorage,NationalAssembly/SenateHousingSociety,OPFSociety, Down Town, Gullberg Residencia, KashmirSociety, Gagri, Jandala,Masalchian,HarDoGair,Bhunder, Sihala Kliurd, Gala Stop, Bhukkar, HaranMera, DarwaJa, Hussain Abad, Ratti Kassi, Pahag,Bangial, D‹arzian, Pind Dian, Dlioke Baba Bahoo, LohiBher, Chuclia Slieikhnn, Gandian, Madina Town, BabaHash,Koshniirian,Rnsala, SherDhainyal,Rajgan.Ladhiot,MeraDadu,Peeja,Khatreel ThandaPani,LelitrarRoad,DreamLandSociety,Royal Society, Green Residence Society, Go PetrolPump,EdenLifeSociety,BlessingMarriageHall.",
  },
  {
    name: "Kohsar",
    contact: "051-9102499",
    location: "F-7 Markz Islamabad",
    email: "sho.kohsar@islamabadpolice.gov.pk",
    boundaries: "F7(F-7Markz,F-7/1,F-7/2,F-7/3,F-7/4) F6 (F-6Markz,F-6/1,F-6/2,F-6/3,F-6/4) E-7,Blue Area, Saidpur,Daman-E-Koh.",
  },
  {
    name: "Koral",
    contact: "051-9252517",
    location: "Koral Chowk",
    email: "sho.koral@islamabadpolice.gov.pk",
    boundaries: "Koral, Ghauri Town, Dokh Haidri, Sharif Abad, Gangal, Dokh Aslam, Hiran Minar, Gulburg Town, Pahag Pinwal, Pind Daian, Daharwala, Bamber Tarar, Pandori Syedan, Pind Mlkan, Ladhyot, Dokh Mistrian, Ghandian, Bhaker, Gora Mast, Khana Dakh, Ghauri Town Barma Town, Gatbal o Madina Town, Tarlai Khurd, Sohdran, Sangam Town, Ghauri Garden, Tarameri, Chaper Mir Khanal, Ali Pur, Stra Mil, jang Syedan, Panchgran, Kirpa, Bangial, Arslan Town, Madina Town, Gora Sardar, Meharban Town, Gora Sardar.",
  },
  {
    name: "Lohi Bher",
    contact: "051-5710906",
    location: "CBR Town",
    email: "sho.lohibher@islamabadpolice.gov.pk",
    boundaries: "Bahria Town, Police Foundation, Doctor Town, Media Town, CBR Town, Pakistan Town, Aghosh Town, River Garden, Sowan Garden, PWD, Korang Town, Jinnah garden, Naval Anchorage, Capital Enclave, OPF, Senate Society, Gulburg, Bander , Ghakri, Sihla khurd, Sihala Khurd, Ghangota Syedan, Ladhyot, Pega, Lohi Bher, Chcha Sihan, Hiran Mera, Hussainabad, Dalyala Sher Dhamial Darwala, her Do Gher, Dokh Darzian, Dokh Rajgan, jandala, Dokh mahi Nawab, Dokh kala Khan, Madina Town, Phaker, Pind Dadiyan.",
  },
  {
    name: "Margalla",
    contact: "051-9261510",
    location: "F-8 Markaz",
    email: "sho.margalla@islamabadpolice.gov.pk",
    boundaries: "F-8,F-9,E-8,E-9, Saniari, klingal, Faisal Mousque, F-8 Kachehri.",
  },
  {
    name: "Nilore",
    contact: "N/A",
    location: "Nilore",
    email: "sho.nilore@islamabadpolice.gov.pk",
    boundaries: "Nilore, Chara, Tumair, Kajna, Thanda Pani, Pagot, Sihali, jandala, Arda/Nilor, Darkala, Chaper.",
  },
  {
    name: "Noon",
    contact: "N/A",
    location: "I-16 markaz",
    email: "sho.noon@islamabadpolice.gov.pk",
    boundaries: "I-14, I-15, I-16, Jhanki Syedan, Pind hoon, Noon Village, Chistian Abad.",
  },
  {
    name: "Phulgran",
    contact: "N/A",
    location: "N/A",
    email: "sho.phulgran@islamabadpolice.gov.pk",
    boundaries: "Atthal,Bobri,Phulgran,Chattar,Sakreela,Mera Begwal,Shahptir,PTVColony.",
  },
  {
    name: "Ramna",
    contact: "051-9330189",
    location: "G-11",
    email: "sho.ramna@islamabadpolice.gov.pk",
    boundaries: "Dhoke Kashmirian, G-10, G-11, G-12( Badia Mehra), High Court.",
  },
  {
    name: "Sabzi Mandi",
    contact: "051-9334840",
    location: "SECTOR I/10 GREEN BELT NEAR SABZI MANDI",
    email: "sho.sabzimandi@islamabadpolice.gov.pk",
    boundaries: "I-10 ,I-11, Sabzi Mandi, Islamic University, H-10 (Graveyard).",
  },
  {
    name: "Sangjani",
    contact: "N/A",
    location: "N/A",
    email: "sho.sangjani@islamabadpolice.gov.pk",
    boundaries: "Mohallah Malkan, Purana Tarnol, Johad Road, Dhoke Ramzania, Dhoke Katrian, Saray Kharboza, Dhoke Abbasi, Dhoke Kashmirian, Dhoke Mughlan, Mohallah Usmania, Madrasa Road Dar ul Aloom Zakriya, Saray Madhoo, Dhoke Taman, Dhoke Pehlwan, Dhoke Rajgan, Dhoke Sulman, Sungjani, Dhoke Jori Garbi, G Dhoke Labana, Jori Sharqi, Chongi No 26, Dhoke Sawayan, Johad, Golra Station, C- 15, C-16, C-17, D-15, D-16, D-17, Dhoke Sangjani, Upper side Mountains (Sharki & Gharbi), Dhoke Jori, Dhoke Raja Mehboob, Sangjani Salim, Piswal and Badhana Khurd.",
  },
  {
    name: "Secretariat",
    contact: "051-9209132",
    location: "G-5 Markaz (Near Presedent House, Prime Minister House, National Library of Pakistan)",
    email: "sho.secretariat@islamabadpolice.gov.pk",
    boundaries: "F-5, G-5, Bari Imam Noor Pur Sahan, Pir Sohawa, Quid e Azam University, Nartil, Ralmli, Malpur Village, Lake View Park, Muree Road Faizabad Talpur.",
  },
  {
    name: "Shahzad Town",
    contact: "051-9247444",
    location: "Shahzad Town",
    email: "sho.shazadtown@islamabadpolice.gov.pk",
    boundaries: "Sahzad Tow, Rawal Town, University Town, Farash Town Phase ii/I, Park Enclave, Green Avenue, Tmaa, Chatha Bakhtawer, Sambal Korak, Mohrian, Tarlai Kallan, Dokh Azam, Ali Pur Farash, Jhang Syedan, Pungran, Batala, Lehtrar Road Burma pull to Jang Syedan, Rawal Dam Chock, Park road in front of Station.",
  },
  {
    name: "Shalimar",
    contact: "051-9266885",
    location: "Street # 8 Near School Chowk F-10/2",
    email: "sho.shalimar@islamabadpolice.gov.pk",
    boundaries: "F-10, F-11, D-10, D-11, Chontra, Saniari, Mera Beri. Areaof Sector E-11.",
  },
  {
    name: "Shamas Colony",
    contact: "051-9334499",
    location: "N/A",
    email: "sho.scolony@islamabadpolice.gov.pk",
    boundaries: "H-11/1, H-11/2, H-12, Shams Colony H-13, Double Road Golra Mor towards Islamabad Chock (till Islamabad Chock), Golra mMor Srinagar Highway Police Lines Signal to Islamabad Chock(Out going Area), Golra Mor to PSO PUMP on GT Road incoming Side, IJP Road ( Raliway Pull to Social Society Hospital), Area of Bokra and New Bokra I-12 (Afghan Camp).",
  },
  {
    name: "Sihala",
    contact: "051-4491334",
    location: "Kahuta Road Near KaK Pull",
    email: "sho.sihala@islamabadpolice.gov.pk",
    boundaries: "Dha Phase 2 and 5, Bahria Town Phase 7, Model Town Humak , Moza Kaak, Niazian,Sarain, Jawaya Maha Chock, Nai Abadi Humak, Mohra Kalu, Dokh Awan, Sowan Camp, Mohar Nagyal, Rajwal, jeddah Town, Zirag Housing Scheme, GT Road, Azam Town, Jarki, Sihala baghan, Hoon Dhamial, Har Do Gher , Chakian Mianthob, Sindhu Syedan, Chochkal, Chak kamdar, Ardi Syedan, nya Mughal, Sihala College, Rawat Bangril, Kortana, Dokh Habib Abad, Morgah City, Dokh rtta, Shams Colony, Bani Sran, Mohrimera, Dokh Tami.",
  },
  {
    name: "Sumbal",
    contact: "N/A",
    location: "G-13 Markaz",
    email: "ps.sumbal@islamabadpolice.gov.pk",
    boundaries: "F-12, F-13, F-14, G-12, G-13, G-14, Thala Sayedan, Shello, Dhreek Mohri, Mera Aku, Mera Jafar.",
  },
  {
    name: "Tarnol",
    contact: "051-2295122",
    location: "GT Road",
    email: "sho.tarnol@islamabadpolice.gov.pk",
    boundaries: "B-17, D-17, G-16, G-16 Shaheen Abad, E-16, Noghazi, F-17, Benazir Chock, Bhatana Kalan, Sarae Kharbuza, Dokh Abbasi,Jhangi Syedan.",
  },
  {
    name: "Women Police Station",
    contact: "051-9252517",
    location: "G-7 Markaz",
    email: "sho.woman@islamabadpolice.gov.pk",
    boundaries: "Whole Islamabad.",
  },
];


export default function EmergencyRespondersPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold font-headline">15 emergency cases</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Islamabad Police Stations</CardTitle>
                    <CardDescription>
                        A comprehensive list of all police stations in Islamabad for emergency contact. 
                        Source: <a href="https://islamabadpolice.gov.pk/PoliceStations.php" target="_blank" rel="noopener noreferrer" className="text-primary underline">Islamabad Police Official Website</a>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        {policeStations.map((station, index) => (
                             <AccordionItem value={`item-${index}`} key={station.name}>
                                <AccordionTrigger className="font-semibold text-base hover:no-underline">{station.name}</AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-3 text-sm text-muted-foreground pl-2">
                                        <div className="flex items-start gap-3">
                                            <Phone className="h-4 w-4 mt-0.5 text-primary" />
                                            <div>
                                                <strong className="text-foreground">Contact:</strong>
                                                {station.contact !== 'N/A' ? (
                                                     <Button asChild variant="link" className="p-0 h-auto ml-2">
                                                        <a href={`tel:${station.contact}`}>{station.contact}</a>
                                                    </Button>
                                                ) : (
                                                    <span className="ml-2">{station.contact}</span>
                                                )}
                                            </div>
                                        </div>
                                         <div className="flex items-start gap-3">
                                            <Mail className="h-4 w-4 mt-0.5 text-primary" />
                                            <div>
                                                <strong className="text-foreground">Email:</strong>
                                                {station.email !== 'N/A' ? (
                                                    <Button asChild variant="link" className="p-0 h-auto ml-2">
                                                        <a href={`mailto:${station.email}`}>{station.email}</a>
                                                    </Button>
                                                ) : (
                                                    <span className="ml-2">{station.email}</span>
                                                )}
                                            </div>
                                        </div>
                                         <div className="flex items-start gap-3">
                                            <MapPin className="h-4 w-4 mt-0.5 text-primary" />
                                            <div>
                                                <strong className="text-foreground">Location:</strong>
                                                <p className="inline ml-2">{station.location !== 'N/A' ? station.location : 'Not Available'}</p>
                                            </div>
                                        </div>
                                         <div className="flex items-start gap-3">
                                            <Milestone className="h-4 w-4 mt-0.5 text-primary" />
                                            <div>
                                                <strong className="text-foreground">Station Boundaries:</strong>
                                                <p className="mt-1">{station.boundaries}</p>
                                            </div>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>
        </div>
    );
}
