import React from 'react'

function MyTextbox({ textArea, setTextArea, style }) {
  return (
    <textarea
      name="content"
      value={textArea}
      onChange={(e) => setTextArea(e.target.value)}
      rows={10}
      cols={10}
      style={style}
    ></textarea>
  )
}

export default MyTextbox