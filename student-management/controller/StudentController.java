package controller;

import model.Student;
import service.StudentService;

import java.util.List;
import java.util.Optional;

public class StudentController {
    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    public List<Student> listStudents() {
        return studentService.getAllStudents();
    }

    public Optional<Student> getStudent(Long id) {
        return studentService.getStudentById(id);
    }

    public Student addStudent(String name, String email) {
        return studentService.createStudent(new Student(null, name, email));
    }

    public Optional<Student> editStudent(Long id, String name, String email) {
        return studentService.updateStudent(id, new Student(id, name, email));
    }

    public boolean removeStudent(Long id) {
        return studentService.deleteStudent(id);
    }
}
