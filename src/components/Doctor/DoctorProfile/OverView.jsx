import React from 'react'
import { VerticalTimeline, VerticalTimelineElement } from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';
import { FaBriefcase } from "react-icons/fa";

const OverView = () => {
    return (
        <div className="col-md-12 col-lg-9">
            <div className='mb-3'>
                <h5 className='overview-text'>About Me</h5>
                <p className='text-secondary'>He is having a rich clinical experience of 18 years in the field of Dentistry. He completed his BDS and MDS in Oral Implantology & Periodontology from the prestigious Manipal University, Institute of Eminence (Status awarded by Government of India). He also holding the DIPLOMATE and FELLOW in Oral Implantology credential from the prestigious ICOI (International Congress of Oral Implantologist) USA. He is member of ICOI USA, Academy of Oral Implantology India and Indian Society of Periodontology India. He is associated as Professor and specialist Consultant.</p>
            </div>

       
         
           
            <div>
                <h5 className='overview-text'>Services</h5>
                <ul>
                    <li>Tooth cleaning </li>
                    <li>Root Canal Therapy</li>
                    <li>Implants</li>
                    <li>Composite Bonding</li>
                    <li>Fissure Sealants</li>
                    <li>Surgical Extractions</li>
                </ul>
            </div>
            <div>
                <h5 className='overview-text'>Specializations</h5>
                <ul className="clearfix">
                    <li>Children Care</li>
                    <li>Dental Care</li>
                    <li>Oral and Maxillofacial Surgery </li>
                    <li>Orthodontist</li>
                    <li>Periodontist</li>
                    <li>Prosthodontics</li>
                </ul>
            </div>
        </div>
    )
}
export default OverView;