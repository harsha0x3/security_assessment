import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

const CreateChecklist = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>New Check</Button>
      </DialogTrigger>
      <DialogContent>
        <p>HEIOFLDVKJONK</p>
        <p>HEIOFLDVKJONK</p>
        <p>HEIOFLDVKJONK</p>
        <p>HEIOFLDVKJONK</p>
        <p>HEIOFLDVKJONK</p>
      </DialogContent>
    </Dialog>
  );
};

export default CreateChecklist;
