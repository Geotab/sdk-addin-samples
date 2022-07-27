const formatDate = (dateTime) => {
  const currentDate = new Date(dateTime);
  const options = {
    weekday: 'short', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true,
  };
  const formattedDate = currentDate.toLocaleDateString('en-US', options);
  const parsedDate = formattedDate.split(', ');
  return { currentDate: `${parsedDate[0]}, ${parsedDate[1]}`, currentTime: parsedDate[2] };
};

export default formatDate;