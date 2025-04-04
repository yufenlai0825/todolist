import React, { useState } from "react";
import Fab from "@mui/material/Fab";
import { Zoom } from "@mui/material"; //import Zoom transition
import AddBoxIcon from "@mui/icons-material/AddBox";

function CreateArea(props) {
  const [note, setNote] = useState({
    title: "",
    content: "",
  });

  const [click, setClick] = useState(false);

  function handleClick() {
    setClick(true);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setNote((prevNote) => {
      return {
        ...prevNote,
        [name]: value,
      };
    });
  }

  function submitNote(event) {
    props.onAdd(note);
    setNote({
      title: "",
      content: "",
    });
    event.preventDefault();
  }

  return (
    <div>
      <form className="create-note">
        <input
          name="title"
          onChange={handleChange}
          onClick={handleClick}
          value={note.title}
          placeholder="Task"
        />
        {click ? (
          <textarea
            name="content"
            onChange={handleChange}
            value={note.content}
            placeholder="Deadline/Note"
            onClick={handleClick}
            rows="3"
          />
        ) : null}
        {click ? (
          <Zoom in={true}>
            <Fab onClick={submitNote}>
              <AddBoxIcon />
            </Fab>
          </Zoom>
        ) : null}
      </form>
    </div>
  );
}

export default CreateArea;
