module.exports = {


  friendlyName: 'attachments.checkImage',


  description: 'Check attachment and return null if not a valid image, or itself if valid.',


  inputs: {
    attachment: {
      type: 'ref',
      required: true,
      description: "Discord Attachment"
    }
  },


  fn: async function (inputs) {
    const imageLink = inputs.attachment.split(".");
    const typeOfImage = imageLink[ imageLink.length - 1 ];
    const image = /(jpg|jpeg|png|gif)/gi.test(typeOfImage);
    if (!image) return null;
    return inputs.attachment;
  }


};

