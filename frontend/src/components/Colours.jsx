import React from 'react'

function Colours({selected, setSelected}) {
    const mood = ['#ce5a5a', '#4d812a', '#4097a3', '#0f9e19'];

    return <div style={{display:'grid', gridTemplateRows:'repeat(2, 20px)', gridTemplateColumns:'repeat(2, 20px)', alignContent:'center', gridGap:'4px'}}>
            {mood.map((item, index)=>{
                return <div
                  key={index}
                  className='color-box'
                  onClick={()=>setSelected(index+1)}
                  style={{
                    background:item,
                    width:'20px',
                    height:'20px',
                    borderRadius:'100%',
                    border:`3px solid ${selected === index+1 ? 'black' : 'transparent'}`
                  }}>
                </div>
            })}
    </div>
}

export default Colours