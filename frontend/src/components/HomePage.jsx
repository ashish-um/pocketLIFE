import React from 'react'
import Navbar from './Navbar'
import AuthButton from '../components/AuthButton.jsx';
import StartwritingButton from './StartwritingButton.jsx';

const HomePage = () => {
    const features = [
        {
            icon: "book-open.svg", // or use an SVG/icon component
            title: "Rustic Diary Theme",
            description: "Enjoy a beautiful, aged-paper theme that makes writing feel like putting pen to a classic journal."
        },
        {
            icon: "image.svg",
            title: "Add Photos to Entries",
            description: "Bring your memories to life. Easily upload and add images to your diary entries to capture the full moment."
        },
        {
            icon: "smile.svg",
            title: "Express with Emojis",
            description: "Add a touch of personality and emotion to your writing with a full range of emojis built right in."
        }
    ];
    return (
        <div className='homepage'>
            <Navbar />
            <div className="hero">
                <div className="content">
                    <h1>“Because Every Day Deserves
                        <br />to Be Remembered”</h1>
                    <h3>PocketLIFE is your private digital diary — a beautifully simple space to capture your thoughts, cherish your memories, and preserve the little moments that make each day special.</h3>
                    <StartwritingButton label='Start Writing'/>
                </div>
            </div>
            <div className="featuresec">
                <h1 style={{ opacity: '1', fontSize: '2rem', margin: '4rem 0 3rem 0' }}><span style={{ color: '#0f9e19' }}>F</span>eatures for your Personal Journal</h1>
                <div className="features">
                    {features.map((feature, index) => (
                        <div className="feature-card" key={index}>
                            <div className="icon">
                                {feature.icon.endsWith(".svg") ? (
                                    <img src={feature.icon} alt="" />
                                ) : (
                                    <span>{feature.icon}</span>
                                )}
                            </div>
                            <h3>{feature.title}</h3>
                            <p>{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default HomePage