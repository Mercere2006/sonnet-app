import React from 'react'

export default function Header(porps) {
  const {title} = porps
  return (
    <div>
      <h1 className='flex'>
        {title}
      </h1>
    </div>
  )
}
